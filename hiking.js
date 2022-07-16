// The value for 'accessToken'
mapboxgl.accessToken = "";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/outdoors-v11",
    center: [-118.34302, 46.06458],
    zoom: 10.7,
});

async function getFeatures() {
	let response = await fetch('http://localhost:8000/hiking.geojson');
	let data = await response.json();
	console.log(data)
	for (const feature of data.features) {
		addFeatures(feature)
    }
}

function addFeatures(feature) {
	// create a HTML element for each feature
        const el = document.createElement("div");
        el.className = "marker";

        // make a marker for each feature and add it to the map
        new mapboxgl.Marker(el)
            .setLngLat(feature.geometry.coordinates)
            .setPopup(
                new mapboxgl.Popup({ offset: 25 }) // add popups
                    .setHTML(`<h3>${feature.properties.title}</h3><p>${feature.properties.description}</p>`)
            )
            .addTo(map);
}

getFeatures();
