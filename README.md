# 🏔️ where to go
🗺️ map of hiking destinations with info to help choose your destination
- hike distance
- drive time
- weather forecast
- smoke forecast

## ⭕ prerequisites
- python web server (see `requirements.txt`)
- your own tokens on `openweather` and `mapbox gl js`
  - the tokens should be stored in `tokens.py` in the same directory as `main.py`:
  ```python
  tokens = {
    "mapbox": "your_mapbox_token",
    "openweather": "your_openweather_token"
  }
  ```

## ☑️ to do
- add legend and credits
- add more hikes
- host it

## 🤗 would be nice
- upload your own `geojson` of destinations

## 🤖 tech stack
- [NOAA API](https://www.weather.gov/documentation/services-web-api) for weather
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/) for map functionality
- [Mapbox Directions API](https://docs.mapbox.com/mapbox-gl-js/api/) for drive times
- [OpenWeather API](https://openweathermap.org/api/air-pollution) for air quality
- [FastAPI](https://fastapi.tiangolo.com/) to serve it

## ▶ run it
- run `server.py`
- visit http://127.0.0.1:6738/
  - to change the starting location - http://127.0.0.1:6738/?long=-120.9392&lat=47.1954
