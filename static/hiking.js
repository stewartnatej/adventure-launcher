//get the party started!
async function party() {
	// test the responses from openweather. eventually we'll add these to each feature
	// get weather
	let weatherResponse = await fetch('/weather');
	let weatherData = await weatherResponse.json()
	console.log(weatherData[0])
	
	// get pollution
	let pollutionResponse = await fetch('/pollution');
	let pollutionData = await pollutionResponse.json()
	console.log(pollutionData[0])
	
	// build the map
	// after launch - https://docs.mapbox.com/help/troubleshooting/how-to-use-mapbox-securely/
	let response = await fetch('/mapbox_token');
	mapboxgl.accessToken = await response.json();
	const map = new mapboxgl.Map({
		container: "map",
		style: "mapbox://styles/mapbox/outdoors-v11",
		center: [-119.73999, 46],
		zoom: 5.5,
	});

	let home = [-118.343, 46.0645]
	addHome(map, home)
	await getFeatures(map, home, mapboxgl.accessToken);
}

function addHome(map, home) {
	// create an HTML element for the starting location
    const h = document.createElement("div");
    h.className = "home";

    // make a marker and add it to the map
    new mapboxgl.Marker(h)
        .setLngLat(home)
        .setPopup(
            new mapboxgl.Popup({ offset: 25 }) // add popups
                .setHTML(`<h3>Launch Pad</h3>`)
        )
        .addTo(map);
}

async function getFeatures(map, home, token) {
	let response = await fetch('/static/hiking.geojson');
	let data = await response.json();
	for (const feature of data.features) {
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
	};
	let dest = feature.geometry.coordinates;
	let dirUrl = new URL('https://api.mapbox.com/directions/v5/mapbox/driving/');
	dirUrl.pathname += `${dest[0]},${dest[1]};${home[0]},${home[1]}`;
	for (let param in params) {
  		dirUrl.searchParams.set(param, params[param]);
	}
	let dirApi = await fetch(dirUrl);
	let directions = await dirApi.json();
	let time = (directions.routes[0].duration / 3600).toFixed(1)
	
	// get weather
	
	
	// create an HTML element for each feature
    const el = document.createElement("div");
    el.className = groupTimes(time);
    
    // make a marker and add it to the map
    new mapboxgl.Marker(el)
        .setLngLat(dest)
        .setPopup(
            new mapboxgl.Popup({ offset: 25 }) // add popups
                .setHTML(`<h3>${feature.properties.title}</h3>
                <p>${time + ' hours'}</p>
                <p>${feature.properties.description}</p>`)
        )
        .addTo(map);
}

function groupTimes(time) {
	if (time < 2) return 'close';
	else return 'far';
}

party()
