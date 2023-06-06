from urllib.parse import urlencode
from contextlib import asynccontextmanager
from aiohttp import ClientSession
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from tokens import tokens

# create the session globally so all functions have access to it.
# the same session can be used for multiple target servers. this is way faster than a session per request
session: ClientSession = None


@asynccontextmanager
async def lifespan(fastapi_app):
    """define events that will happen upon app startup (before the yield) and shutdown (after the yield)"""
    global session  # make the variable open to modification
    session = ClientSession()  # open a session for the duration of the app
    yield
    await session.close()

app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# could lock this down more once we know what the origin will be
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get('/', response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})


@app.get('/mapbox_token')
async def mapbox_token():
    return tokens['mapbox']


@app.get('/pollution')
async def pollution(lat, long):
    """
    the received pollution forecast is hourly for 4 days.
    this function outputs the aqi in 12 hour intervals
    """
    url = 'https://api.openweathermap.org/data/2.5/air_pollution/forecast'
    params = {
        'lat': lat,
        'lon': long,
        'appid': tokens["openweather"]
    }
    pollution_url = f'{url}?{urlencode(params)}'
    async with session.get(pollution_url) as response:
        response_json = await response.json()

    # sample the AQI every 12 hours
    pollution_subset = [
        v['main']['aqi']
        for i, v in enumerate(response_json['list'])
        if (i+1) % 12 == 0
    ]
    return pollution_subset
