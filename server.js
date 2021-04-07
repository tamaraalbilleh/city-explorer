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
server.get ('/movies',moviesHandler);
server.get ('/yelp', yelpHandler);



// rout handlers //

// home
function homeRoutHandler (req,res){
  res.send('server is alive !');
}


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
        if(arr[i].toLocaleLowerCase().includes(cityName.toLocaleLowerCase())){ // if it does exist this will return true //
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

      // console.log('safe',[safeValues[0]]);
      client.query (SQL,[safeValues[0]]).then(result=>{
        // console.log ('q result rows',result.rows);
        res.send (result.rows[0]);
      });
    }

  })
    .catch (error=>{
      res.send(error);
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


  })
    .catch (error=>{
      res.send(error);
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
  })
    .catch (error=>{
      res.send(error);
    });

}


// movies //
// Request URL: https://city-expl0rer.herokuapp.com/movies?search_query=Seattle&formatted_query=Seattle%2C%20Seattle%2C%20Washington%2C%2098104%2C%20USA&latitude=47.60383210000000&longitude=-122.33006240000000&page=1
function moviesHandler (req,res) {
  let cityName = req.query.search_query;
  // console.log (cityName);
  let key = process.env.MOVIE_API_KEY;
  let moviesURL = `https://api.themoviedb.org/3/discover/movie?api_key=${key}&query=${cityName}`;
  superagent.get(moviesURL).then(movieData => {
    let mData = movieData.body.results;
    let targetData = mData.map (item=>{
      return new Movies (item);
    });
    // console.log ('mdata',mData);
    // let data1 =pData.data.map (item => new Parks (item));
    res.send (targetData);
  })
    .catch (error=>{
      res.send(error);
    });

}


// yelp //
// Request URL: http://localhost:3000/yelp?search_query=Seattle&formatted_query=Seattle%2C%20Seattle%2C%20Washington%2C%2098104%2C%20USA&latitude=47.60383210000000&longitude=-122.33006240000000&page=1
function yelpHandler (req,res) {
  let cityName = req.query.search_query;
  let page = req.query.page;
  let key = process.env.YELP_API_KEY;
  let limit = 5;
  let offset =  ((page - 1) * limit) + 1;
  let yelpURL = `https://api.yelp.com/v3/businesses/search?term=restaurants&location=${cityName}&limit=${limit}&offset=${offset || 5}`;
  superagent.get(yelpURL)
    .set ('Authorization',`Bearer ${key}`)
    .then (yelpData=>{
      let yData = yelpData.body.businesses;
      let targetData = yData.map (item=>{
        return new Yelp(item);
      });
      res.send (targetData);
    })

    .catch (error=>{
      res.send(error);
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


// movies
function Movies (movieData){
  this.title = movieData.original_title;
  this.overview = movieData.overview;
  this.average_votes = movieData.vote_average;
  this.total_votes = movieData.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500${movieData.backdrop_path}`;
  this.popularity = movieData.popularity;
  this.released_on = movieData.release_date;
}


// yelp
function Yelp (yelpData){
  this.name = yelpData.name;
  this.image_url = yelpData.image_url;
  this.price = yelpData.price;
  this.rating =yelpData.rating ;
  this.url = yelpData.url;
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
