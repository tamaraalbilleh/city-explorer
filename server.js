const express = require('express'); // to import express library //
const server = express(); // to give the server all express methods //
require('dotenv').config(); // to import dotenv //
const PORT = process.env.PORT || 5000; // to establish 3 ports locally //
server.listen(PORT,()=>{
  console.log (`listening on PORT ${PORT}`); // to make the server listen on the current used port //
}); // the message to alert on what port the server is listening //

const cors = require('cors'); // to import cors //
server.use (cors()); // to make the server use cors methods //

server.get ('*',(req,res)=>{
  let errorObject = {
    status: 500,
    responseText : 'Sorry, something went wrong , ...'
  };
  res.status(500).send (errorObject);
});

server.get ('/',(req,res)=>{ // to make a request/response when user is  on '/' //
  res.send('server is alive !');
});


// this is what i want for a response to  /location
// {
//     "search_query": "seattle",
//     "formatted_query": "Seattle, WA, USA",
//     "latitude": "47.606210",
//     "longitude": "-122.332071"
//   }
server.get ('/location',(req,res)=>{
  let geoData = require ('./data/location.json');
  let newLocation = new Location(geoData);
  res.send (newLocation);
});

function Location (geoData) {
  let search = geoData[0].display_name.split (',');
  this.search_query = search[0];
  this.formatted_query =geoData[0].display_name;
  this.latitude =geoData[0].lat;
  this.longitude = geoData[0].lon;
}

// this is what i want for a response to  /weather
// [
//     {
//       "forecast": "Partly cloudy until afternoon.",
//       "time": "Mon Jan 01 2001"
//     },
//     {
//       "forecast": "Mostly cloudy in the morning.",
//       "time": "Tue Jan 02 2001"
//     },
//     ...
//   ]
server.get ('/weather',(req,res)=>{
  let weatherData = require ('./data/weather.json');
  let weatherArray = [];
  let data = Object.entries (weatherData);
  data[0][1].forEach (item=>{
    let newWeather = new Weather (item);
    // console.log (newWeather);
    weatherArray.push (newWeather);
    console.log (weatherArray);
  });

  res.send (weatherArray);
});

function Weather (weatherData) {

  this.forcast = weatherData.weather.description;
  this.time = weatherData.datetime;
}

// this is what i want for an error  for any other wrong request
// {
//     status: 500,
//     responseText: "Sorry, something went wrong",
//     ...
//   }

// server.get ('*',(req,res)=>{
//   let errorObject = {
//     status: 500,
//     responseText : 'Sorry, something went wrong , ...'
//   };
//   res.status(500).send (errorObject);
// });
