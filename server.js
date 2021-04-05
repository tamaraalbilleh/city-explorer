'use strict';

// DOTENV //
require('dotenv').config();

// Dependencies //
const express = require('express');
const cors = require('cors');
const superagent = require ('superagent');
// setup //
const server = express();
const PORT = process.env.PORT || 5000;
server.use (cors());

// server is listening //
server.listen(PORT,()=>{
  console.log (`listening on PORT ${PORT}`);
});

// routs //
server.get ('/',homeRoutHandler);
server.get ('/location',locationHandler);
server.get ('/weather',weatherHandler);
server.get ('/parks',parksHandler);
server.get ('*',errorHandler);

// rout handlers //
// home
function homeRoutHandler (req,res){
  res.send('server is alive !');
}
// location
// https://city-expl0rer.herokuapp.com/location?city=amman // request url
function locationHandler (req,res){
  let cityName = req.query.city;
  // console.log (req.query);
  // let geoData = require ('./data/location.json');
  let key = process.env.GEOCODE_API_KEY;
  let locationURL = `https://api.locationiq.com/v1/autocomplete.php?key=${key}&q=${cityName}`;
  superagent.get(locationURL).then(geoData => {
    let gData = geoData.body;
    let newLocation = new Location(gData);
    res.send (newLocation);
  });

}

// weather
// https://city-expl0rer.herokuapp.com/weather?search_query=Lynnwood&formatted_query=Lynnwood%2C%20Snohomish%20County%2C%20Washington%2C%20USA&latitude=47.8278656&longitude=-122.3053932&page=1
function weatherHandler (req,res){
  // let weatherData = require ('./data/weather.json');
  let city = req.query.search_query;
  let weatherArray = [];
  let key = process.env.WEATHER_API_KEY;
  let weatherURL = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${key}`;
  superagent.get (weatherURL).then (weatherData=>{
    let data = weatherData.body;

    let data2 = Object.entries (data);
    // let data3 =Object.entries (data2);
    // console.log (data3);
    // res.send (data2);
    data2[0][1].map (item=>{
      let newWeather = new Weather (item);
      weatherArray.push (newWeather);
    });
    res.send (weatherArray);


  });
}
// parks







// error
function errorHandler (req,res){
  let errorObject = {
    status: 500,
    responseText : 'Sorry, something went wrong , ...'
  };
  res.status(500).send (errorObject);
}

// constructors //
// location
function Location (geoData) {
  let search = geoData[0].display_name.split (',');
  this.search_query = search[0];
  this.formatted_query =geoData[0].display_name;
  this.latitude =geoData[0].lat;
  this.longitude = geoData[0].lon;
}
// weather
function Weather (weatherData) {

  this.forcast = weatherData.weather.description;
  this.time = new Date( weatherData.datetime).toString().slice(0, 15);
}
// parks



// [
//   {
//    "name": "Klondike Gold Rush - Seattle Unit National Historical Park",
//    "address": "319 Second Ave S., Seattle, WA 98104",
//    "fee": "0.00",
//    "description": "Seattle flourished during and after the Klondike Gold Rush. Merchants supplied people from around the world passing through this port city on their way to a remarkable adventure in Alaska. Today, the park is your gateway to learn about the Klondike Gold Rush, explore the area's public lands, and engage with the local community.",
//    "url": "https://www.nps.gov/klse/index.htm"
//   },
//   {
//    "name": "Mount Rainier National Park",
//    "address": "55210 238th Avenue East, Ashford, WA 98304",
//    "fee": "0.00",
//    "description": "Ascending to 14,410 feet above sea level, Mount Rainier stands as an icon in the Washington landscape. An active volcano, Mount Rainier is the most glaciated peak in the contiguous U.S.A., spawning five major rivers. Subalpine wildflower meadows ring the icy volcano while ancient forest cloaks Mount Rainier’s lower slopes. Wildlife abounds in the park’s ecosystems. A lifetime of discovery awaits.",
//    "url": "https://www.nps.gov/mora/index.htm"
//   },
//   ...
// ]

// Request URL: https://city-expl0rer.herokuapp.com/parks?search_query=Lynnwood&formatted_query=Lynnwood%2C%20Snohomish%20County%2C%20Washington%2C%20USA&latitude=47.8278656&longitude=-122.3053932&page=1
function parksHandler (req , res){
  // let city1 = req.query;
  let city = req.query.search_query;
  let key = process.env.PARKS_API_KEY;
  // console.log (city1);
  let parksURL = `https://developer.nps.gov/api/v1/parks?q=${city}&api_key=${key}`;
  
  // console.log (parksURL);
  superagent.get('https://developer.nps.gov/api/v1/parks?q=seattle&api_key=luIcYs1ZANUUlrT19lI5l4cfuhO1dtXyUhgQaLo2&format=json').then(parkData => {
    console.log (parkData);
    // let gData = geoData.body;
    // let newLocation = new Location(gData);
    res.send (parkData);
  });
  
}

// function Parks (parksData){
//   this.name = ;
//   this.address = ;
//   this.fee = ;
//   this.description = ;
//   this.url = ;
// }