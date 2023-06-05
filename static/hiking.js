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
		// invoke addFeatures and, without waiting for it to finish, process the next feature
		// since there is no downstream processing, we don't need to ensure all invocations complete
		addFeatures(map, feature, home, token)
	}
}


async function addFeatures(map, feature, home, token) {
	let dest = feature.geometry.coordinates

	// asynchronously get drive time, weather, and pollution
	let [driveTime, weather, pollution] = await Promise.all(
		[
			getDrive(home, dest, token),
			getWeather(dest),
			getPollution(dest)
		]
	)

	// create a marker element for each feature
	let marker = document.createElement("div")
	marker.id = feature.properties.title  // groupTimes(driveTime)

	// populate the popup content
	let html = `<h3>${feature.properties.title}</h3>
		Drive time: ${driveTime} hours
		<br>${feature.properties.miles} mile hike`

	// add the marker/popup to the map
	let popup = new mapboxgl.Popup({ offset: 25 }).setHTML(html)
	new mapboxgl.Marker(marker)
		.setLngLat(dest)
		.setPopup(popup)
		.addTo(map)

	formatMarker(weather, pollution, feature.properties.title)
}


function formatMarker(weather, pollution, id) {
	let cells = 16
	let colors = ['red', 'green', 'blue', 'yellow']

	// get the marker element
	let gridContainer = document.getElementById(id)

	// generate the grid
	for (let i = 0; i < 8; i++) {
		const gridCell = document.createElement('div')
		gridCell.className = 'tooltip'
		gridCell.style.backgroundColor = colors[(i) % colors.length]
		gridContainer.appendChild(gridCell)

		// create the tooltip text element
		const tooltipText = document.createElement('span');
		tooltipText.className = 'tooltiptext'
		tooltipText.innerText = weather[i].detailedForecast

		gridCell.appendChild(tooltipText)  // append tooltip text to the grid cell
		gridContainer.appendChild(gridCell)  // append grid cell to the container
	}

	for (let i = 0; i < 8; i++) {
		const gridCell = document.createElement('div')
		gridCell.className = 'tooltip'
		gridCell.style.backgroundColor = colors[(i + 1) % colors.length]
		gridContainer.appendChild(gridCell)

		// create the tooltip text element
		const tooltipText = document.createElement('span');
		tooltipText.className = 'tooltiptext'
		tooltipText.innerText = 'pollution ...'

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
	gridContainer.style.border = '2px solid black'
}


async function getDrive(home, dest, token) {
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
		({detailedForecast, name, probabilityOfPrecipitation: {value: percentPrecip}, temperature}
		) => ({detailedForecast, name, percentPrecip, temperature})
	)
}

async function getPollution(dest) {
	let pollutionResponse = await fetch(`/pollution?lat=${dest[1]}&long=${dest[0]}`)
	return await pollutionResponse.json()
}


function groupTimes(time) {
	if (time < 2) return 'close'
	else if (time < 5) return 'medium'
	else return 'far'
}


//get the party started!
party()
