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
		// default if the url doesn't contain lat and long.
		// they could still be incorrect (e.g., strings), but we won't bother with that
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
	let popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>Launch Pad</h3>`)
	new mapboxgl.Marker(h)
		.setLngLat(home)
		.setPopup(popup)
		.addTo(map)
}


async function getFeatures(map, home, token) {
	let response = await fetch('/static/hiking.geojson')
	let data = await response.json()
	for (let feature of data.features) {
		// invoke addFeatures and, without waiting for it to finish, process the next feature.
		// since there is no downstream processing, we don't need to ensure all invocations complete
		addFeatures(map, feature, home, token)
	}
}


async function addFeatures(map, feature, home, token) {  // adds hiking destination to the map
	let dest = feature.geometry.coordinates

	// asynchronously get drive time, weather, and pollution
	let [driveTime, weather, pollution] = await Promise.all(
		[
			getDriveHours(home, dest, token),
			getWeather(dest),
			getPollution(dest)
		]
	)

	// create a marker element for each feature
	let marker = document.createElement("div")
	marker.id = feature.properties.title

	// populate the popup content
	let html = `<h3>${feature.properties.title}</h3>Drive time: ${driveTime} hours`

	// add the marker/popup to the map
	let popup = new mapboxgl.Popup({ offset: 25 }).setHTML(html)
	new mapboxgl.Marker(marker)
		.setLngLat(dest)
		.setPopup(popup)
		.addTo(map)

	formatMarker(driveTime, weather, pollution, feature.properties.title)
}


function formatMarker(driveTime, weather, pollution, id) {  // styles a grid with all desired info
	// get the marker element
	let gridContainer = document.getElementById(id)

	// generate the weather grid
	for (let i = 0; i < 8; i++) {
		const gridCell = document.createElement('div')
		gridCell.className = 'tooltip'
		gridCell.style.backgroundImage = `url(${weather[i].icon})`
		gridCell.style.backgroundSize = 'cover'
		gridContainer.appendChild(gridCell)

		// create the tooltip text element
		const tooltipText = document.createElement('span');
		tooltipText.className = 'tooltiptext'
		tooltipText.innerText = weather[i].detailedForecast

		gridCell.appendChild(tooltipText)  // append tooltip text to the grid cell
		gridContainer.appendChild(gridCell)  // append grid cell to the container
	}

	// generate the pollution grid
	for (let i = 0; i < 8; i++) {
		const gridCell = document.createElement('div')
		gridCell.className = 'tooltip'
		gridCell.style.backgroundColor = pollutionToColor(pollution[i])
		gridContainer.appendChild(gridCell)

		// create the tooltip text element
		const tooltipText = document.createElement('span');
		tooltipText.className = 'tooltiptext'
		tooltipText.innerText = `AQI: ${pollution[i]}`

		gridCell.appendChild(tooltipText)  // append tooltip text to the grid cell
		gridContainer.appendChild(gridCell)  // append grid cell to the container
	}

	// apply CSS styles to the grid container
	gridContainer.style.display = 'grid'
	gridContainer.style.gridTemplateColumns = 'repeat(8, 1fr)'
	gridContainer.style.gridTemplateRows = 'repeat(2, 1fr)'
	gridContainer.style.width = '100px'
	gridContainer.style.height = '25px'
	gridContainer.style.cursor = 'pointer'
	gridContainer.style.border = `3px solid ${timeToColor(driveTime)}`
}


async function getDriveHours(home, dest, token) {
	let params = {
		alternatives: false,
		geometries: 'geojson',
		overview: 'simplified',
		steps: false,
		access_token: token
	}

	let dirUrl = new URL('https://api.mapbox.com/directions/v5/mapbox/driving/')
	dirUrl.pathname += `${dest[0]},${dest[1]};${home[0]},${home[1]}`
	for (let param in params) {
		dirUrl.searchParams.set(param, params[param])
	}
	let dirApi = await fetch(dirUrl)
	let directions = await dirApi.json()
	return (directions.routes[0].duration / 3600).toFixed(1)
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
	return nearFuture.map(  // un-nest and rename chance of precipitation
		({detailedForecast, icon, name, probabilityOfPrecipitation: {value: percentPrecip}, temperature}
		) => ({detailedForecast, icon, name, percentPrecip, temperature})
	)  // list of objects containing weather info
}


async function getPollution(dest) {
	// query the server, to avoid exposing token to client
	let pollutionResponse = await fetch(`/pollution?lat=${dest[1]}&long=${dest[0]}`)
	return await pollutionResponse.json()  // list of air quality indexes
}


function timeToColor(time) {
	if (time < 2) return '#2980B9'
	if (time < 4) return '#8E44AD'
	if (time < 6) return '#EB984E'
	return '#E74C3C'
}


function pollutionToColor(aqi) {
	return {
		1: '#F8F9F9',
		2: '#E5E7E9',
		3: '#AAB7B8',
		4: '#616A6B',
		5: '#424949'
	}[aqi]
}

//get the party started!
party()
