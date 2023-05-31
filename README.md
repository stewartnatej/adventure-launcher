# 🏔️ where to go
🗺️ map of hiking destinations with info to help choose your destination
- hike distance
- drive time
- weather forecast
- smoke forecast

## ⭕ prerequisites
- you must have your own tokens on openweather and mapbox gl js

## 🤔 desired end state
- hike popups: drive time, 5-day outlook for weather and smoke
- map display: change symbols based on drop-down of metrics

## ☑️ to do
- break down weather and smoke forecasts
- add more hikes

### 🌦️ desired smoke/weather metrics
- convert utc times to local day
- calculate average aqi for the day
- calculate high/low for the day
- percent of day with possible rain?? doesn't capture intensity
- [possible weather codes](https://openweathermap.org/weather-conditions)

## 🤗 nice to have
- enter launch pad coordinates from within map
- if a metric is not being used for display, don't fetch it until its popup is activated
- host somewhere to make accessible to the global web

## 🤖 tech stack
- [mapbox](https://www.mapbox.com/)
- [openweather api](https://openweathermap.org)
- simple python web server - run `server.py`
