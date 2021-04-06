'use strict';

// DOTENV //
require('dotenv').config();


// Dependencies //
const express = require('express');
const cors = require('cors');
const superagent = require ('superagent');
const pg = require('pg');

// setup //
const server = express();
const PORT = process.env.PORT || 5000;
server.use (cors());
const client = new pg.Client( {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized : false
  }
});

// server is listening //
client.connect().then (()=>{
  server.listen(PORT,()=>{
    console.log (`listening on PORT ${PORT}`);
  });
});



// routs //
server.get ('/',homeRoutHandler);
server.get ('/location',locationHandler);
server.get ('/weather',weatherHandler);
server.get ('/parks',parksHandler);


// rout handlers //

// home
function homeRoutHandler (req,res){
  res.send('server is alive !');
}

// lab 07 //
// location
// https://city-expl0rer.herokuapp.com/location?city=amman // request url
// function locationHandler (req,res){
//   let cityName = req.query.city;
//   // console.log (req.query);
//   // let geoData = require ('./data/location.json');
//   let key = process.env.GEOCODE_API_KEY;
//   let locationURL = `https://api.locationiq.com/v1/autocomplete.php?key=${key}&q=${cityName}`;
//   superagent.get(locationURL).then(geoData => {
//     let gData = geoData.body;
//     let newLocation = new Location(gData);
//     res.send (newLocation);
//   });

// }


// lab 08 //
// locations
// https://city-expl0rer.herokuapp.com/location?city=amman // request url
function locationHandler (req,res){
  let cityName = req.query.city;
  let searchCommand = `SELECT search_query FROM locations `; // to search generally in all search_query values that exists //
  client.query(searchCommand).then (result=>{
    console.log ('this is results',result.rows);
    let arr = result.rows; // stored the rows in an array //
    let newArr = []; // created a new array //
    for (let i=0;i<arr.length;i++){
      newArr.push (arr[i].search_query); // pushed only the property search_query in to it to get rid of the object //
    }
    function check (arr){ // created a function to check if the city name the user enters already exist in the array //
      for (let i =0;i<arr.length;i++){
        if(arr[i].toLocaleLowerCase().includes(cityName.toLocaleLowerCase())){ // it it does exist this will return true //
          return true;
        }
      }
    }
    if (!check (newArr)){ // if it didnt exist this will happen //
      console.log ('no it doesnt');
      let key = process.env.GEOCODE_API_KEY;
      let locationURL = `https://api.locationiq.com/v1/autocomplete.php?key=${key}&q=${cityName}`;
      superagent.get(locationURL).then(geoData => {
        let SQL = `INSERT INTO locations(search_query,formatted_query,latitude,longitude)VALUES($1,$2,$3,$4) RETURNING *;`;
        let gData = geoData.body;
        let newLocation = new Location(gData);
        let safeValues = [newLocation.search_query,newLocation.formatted_query,newLocation.latitude,newLocation.longitude];
        client.query (SQL,safeValues).then(result=>{
          res.send (newLocation);
        });
      });
    }
    else { // if it does already exist this will happen //
      console.log ('yeah it does');
      let SQL = `SELECT * FROM locations WHERE search_query = $1`;
      // let safeValues = cityName.charAt(0).toUpperCase() + cityName.slice(1); // to capitalize the first letter //
      let safeValuesArray = newArr;
      let safeValues = safeValuesArray.filter(item=>{
        return item.toLocaleLowerCase().includes(cityName.toLocaleLowerCase());
      });

      console.log('safe',[safeValues[0]]);
      client.query (SQL,[safeValues[0]]).then(result=>{
        console.log ('q result rows',result.rows);
        res.send (result.rows[0]);
      });
    }

  });
}

// weather
// https://city-expl0rer.herokuapp.com/weather?search_query=Lynnwood&formatted_query=Lynnwood%2C%20Snohomish%20County%2C%20Washington%2C%20USA&latitude=47.8278656&longitude=-122.3053932&page=1
function weatherHandler (req,res){
  // let weatherData = require ('./data/weather.json');
  let city = req.query.search_query;
  let key = process.env.WEATHER_API_KEY;
  let weatherURL = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${key}`;
  superagent.get (weatherURL).then (weatherData=>{
    let data = weatherData.body;
    let data2 = data.data;
    let weatherArray = data2.map (item=>{
      return new Weather (item);
    });
    res.send (weatherArray);


  });
}



// parks
// Request URL: https://city-expl0rer.herokuapp.com/parks?search_query=Lynnwood&formatted_query=Lynnwood%2C%20Snohomish%20County%2C%20Washington%2C%20USA&latitude=47.8278656&longitude=-122.3053932&page=1
function parksHandler (req , res){
  // let city1 = req.query;
  let city = req.query.search_query;
  let key = process.env.PARKS_API_KEY;
  // console.log (city1);
  let parksURL = `https://developer.nps.gov/api/v1/parks?q=${city}&api_key=${key}`;
  // let parksArray = [];
  // console.log (parksURL);
  superagent.get(parksURL).then(parkData => {
    let pData = parkData.body;
    let targetData = pData.data;
    let responseArray = targetData.map (item=>{
      return new Parks (item);
    });
    // let data1 =pData.data.map (item => new Parks (item));
    res.send (responseArray);
  });

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

  this.forecast = weatherData.weather.description;
  this.time = new Date( weatherData.datetime).toString().slice(0, 15);
}


// parks
function Parks (parksData){
  this.name = parksData.fullName;
  this.address =`${parksData.addresses[0].line1}, ${parksData.addresses[1].line1} `;
  this.fee =parksData.entranceFees[0].cost ;
  this.description =parksData.description ;
  this.url =parksData.url ;
}


// error
function errorHandler (req,res){
  let errorObject = {
    status: 500,
    responseText : 'Sorry, something went wrong , ...'
  };
  res.status(500).send (errorObject);
}
server.get ('*',errorHandler);


