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
const client = new pg.Client(process.env.DATABASE_URL);

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


// test
// https://city-expl0rer.herokuapp.com/location?city=amman // request url
function locationHandler (req,res){
  let cityName = req.query.city;
  let searchValue = req.query.city;
  // let searchCommand = `SELECT * FROM locations WHERE search_query = $1`;Searchstring
  // let searchCommand = `SELECT * FROM locations WHERE search_query CONTAINS $1`;
  let searchCommand = `SELECT search_query FROM locations `;
  client.query(searchCommand).then (result=>{
    // client.query(`SELECT * FROM locations WHERE search_query`).then (result=>{
    // let newLocation = new Location(result);
    console.log ('this is results',result.rows);
    let arr = result.rows;
    let newArr = [];
    for (let i=0;i<arr.length;i++){
      newArr.push (arr[i].search_query);
    }
    let obj = { search_query: `${cityName}` };
    console.log ('this is the value array',newArr);
    console.log ('city name',cityName);
    function check (arr){
      for (let i =0;i<arr.length;i++){
        if(arr[i].toLowerCase() === cityName.toLowerCase()){
          return true;
        }
      }
    }
    if (!check (newArr)){
      console.log ('no it doesnt');
      let key = process.env.GEOCODE_API_KEY;
      let locationURL = `https://api.locationiq.com/v1/autocomplete.php?key=${key}&q=${cityName}`;
      superagent.get(locationURL).then(geoData => {
        let SQL = `INSERT INTO locations(search_query,formatted_query,latitude,longitude)VALUES($1,$2,$3,$4) RETURNING *;`;
        let gData = geoData.body;
        let newLocation = new Location(gData);
        let safeValues = [newLocation.search_query,newLocation.formatted_query,newLocation.latitude,newLocation.longitude];
        client.query (SQL,safeValues).then(result=>{
          console.log ('new',result.rows);
          res.send (newLocation);
        });
      });
    }
    else { console.log ('yeah it does');
    let SQL = `INSERT INTO locations(search_query,formatted_query,latitude,longitude)VALUES($1,$2,$3,$4) RETURNING *;`;
    let safeValues = [newLocation.search_query,newLocation.formatted_query,newLocation.latitude,newLocation.longitude];

    // client.query (SQL,safeValues).then(result=>{
    //   console.log ('new',result.rows);
    //   res.send (newLocation);
    // });
    }




    //   console.log ('old',result.rows);
    //
    // }

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


