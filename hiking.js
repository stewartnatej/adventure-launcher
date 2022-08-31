//get the party started!
async function party() {
	// get tokens
	let response = await fetch('http://localhost:8000/tokens.json');
	tokens = await response.json();
	mapboxgl.accessToken = tokens.mapbox
	weatherToken = tokens.openweather
	
	// get weather (3 hour steps for 5 days)
	// condition codes - https://openweathermap.org/weather-conditions
	let test = [-118.343, 46.0645]
	formatted = 'lat=' + test[1] + '&lon=' + test[0]
	wUrl = 'https://api.openweathermap.org/data/2.5/forecast?'
	wUrl += formatted + '&units=imperial&appid=' + weatherToken
	let wApi = await fetch(wUrl);
	let whether = await wApi.json();
	console.log(wUrl)
	console.log(whether.list[1])
	
	// get pollution (hourly for 5 days)
	pUrl = 'https://api.openweathermap.org/data/2.5/air_pollution/forecast?'
	pUrl += formatted + '&appid=' + weatherToken
	let pApi = await fetch(pUrl);
	let pollution = await pApi.json();
	console.log(pUrl)
	console.log(pollution.list[1])
	
	// build the map
	const map = new mapboxgl.Map({
		container: "map",
		style: "mapbox://styles/mapbox/outdoors-v11",
		center: [-119.73999, 46],
		zoom: 5.5,
	});
	
	let home = [-118.343, 46.0645]
	addHome(map, home)
	getFeatures(map, home, mapboxgl.accessToken);
};

function addHome(map, home) {
	// create a HTML element for each feature
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
};

async function getFeatures(map, home, token) {
	let response = await fetch('http://localhost:8000/hiking.geojson');
	let data = await response.json();
	for (const feature of data.features) {
		addFeatures(map, feature, home, token)
    }
};

async function addFeatures(map, feature, home, token) {
	// get drive time
	let dest = feature.geometry.coordinates
	let dirUrl = 'https://api.mapbox.com/directions/v5/mapbox/driving/'
	dirUrl += dest[0] + '%2C' + dest[1] + '%3B' + home[0] + '%2C' + home[1]
	dirUrl += '?alternatives=false&geometries=geojson&overview=simplified&steps=false&access_token=' + token
	let dirApi = await fetch(dirUrl);
	let directions = await dirApi.json();
	let time = (directions.routes[0].duration / 3600).toFixed(1)
	
	// get weather
	
	
	// create a HTML element for each feature
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
};

function groupTimes(time) {
	if (time < 2) return 'close';
	else return 'far';
};

party()
