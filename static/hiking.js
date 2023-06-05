async function party() {
	// get mapbox token - https://docs.mapbox.com/help/troubleshooting/how-to-use-mapbox-securely/
	let tokenResponse = await fetch('/mapbox_token')
	mapboxgl.accessToken = await tokenResponse.json()

	// build the map
	let map = new mapboxgl.Map({
		container: "map",
		style: "mapbox://styles/mapbox/outdoors-v11",
		center: [-119.73999, 46],
		zoom: 5.5,
	})

	let home = getHome()
	addHome(map, home)
	await getFeatures(map, home, mapboxgl.accessToken)
}


function getHome() {
	// parse the starting location from the url
	let url = new URL(window.location.href)
	let queryParams = url.searchParams
	let long = queryParams.get("long") ?? 0
	let lat = queryParams.get("lat") ?? 0
	if (long === 0 || lat === 0) {
		// default if the url doesn't contain lat and long (but they could still be incorrect)
		return [-118.343, 46.0645]
	} else {
		return [long, lat]
	}
}

function addHome(map, home) {
	// create an HTML element for the starting location
	let h = document.createElement("div")
	h.className = "home"

	// make a marker and add it to the map
	let popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
		`<h3>Launch Pad</h3>`
	)
	new mapboxgl.Marker(h)
		.setLngLat(home)
		.setPopup(popup)
		.addTo(map)
}


async function getWeather(loc) {
	// find the station and api url for the forecast
	let stationResponse = await fetch(`https://api.weather.gov/points/${loc[1]},${loc[0]}`)
	let stationData = await stationResponse.json()

	// get the forecast
	let forecastUrl = stationData.properties.forecast
	let weatherResponse = await fetch(forecastUrl)
	let weatherData = await weatherResponse.json()

	// get rid of days and properties we don't need
	let nearFuture = weatherData.properties.periods.slice(0, 8)
	let focusedData = nearFuture.map(  // un-nest and rename chance of precipitation
		({detailedForecast, name, probabilityOfPrecipitation:  {value: percentPrecip}, temperature}
		) => ({detailedForecast, name, percentPrecip, temperature})
	)
	return focusedData
}


async function getFeatures(map, home, token) {
	let response = await fetch('/static/hiking.geojson')
	let data = await response.json()
	for (let feature of data.features) {
		addFeatures(map, feature, home, token)
    }
}


async function addFeatures(map, feature, home, token) {
	// get drive time
	let params = {
  		alternatives: false,
  		geometries: 'geojson',
  		overview: 'simplified',
  		steps: false,
  		access_token: token
	}
	let dest = feature.geometry.coordinates
	let dirUrl = new URL('https://api.mapbox.com/directions/v5/mapbox/driving/')
	dirUrl.pathname += `${dest[0]},${dest[1]};${home[0]},${home[1]}`
	for (let param in params) {
  		dirUrl.searchParams.set(param, params[param])
	}
	let dirApi = await fetch(dirUrl)
	let directions = await dirApi.json()
	let time = (directions.routes[0].duration / 3600).toFixed(1)
	
	// get weather
	let weather = await getWeather(dest)

	// get pollution
	let pollutionResponse = await fetch(`/pollution?lat=${dest[1]}&long=${dest[0]}`)
	let pollutionData = await pollutionResponse.json()
	//console.log(pollutionData[0])
	
	// create an HTML element for each feature
    let el = document.createElement("div")
    el.className = groupTimes(time)
    
    // make a marker and add it to the map
	let popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
		`<h3>${feature.properties.title}</h3>
		<p>Drive time: ${time} hours</p>
		<p>${feature.properties.miles} mile hike</p>
		<p>${weather[0].detailedForecast}</p>
		<p>aqi: ${pollutionData[0].main.aqi}</p>`
	)
    new mapboxgl.Marker(el)
        .setLngLat(dest)
        .setPopup(popup)
        .addTo(map)
}


function groupTimes(time) {
	if (time < 2) return 'close'
	else return 'far'
}


//get the party started!
party()
