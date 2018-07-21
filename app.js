const axios = require('axios');
const CronJob = require('cron').CronJob;
const admin = require("firebase-admin");
var serviceAccount = require("./firebase-adminsd.json");

function getDate(){
  return new Date(Date.now()).toLocaleString();
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://weatherminer.firebaseio.com"
});
var db = admin.database();


const darkSkyKey = "37b8356444fc0bfc5d7cc6c1b1f9958c";
const weatherUndergroundKey = "85590f6b6fc6bcd1";

const Cordinates = [
  {latitude: 37.8267, longitude: -122.4233, id: "Los Angles"},
  {latitude: 31.5204, longitude:   74.3587, id: "Lahore"},
  {latitude: 51.5074, longitude:   -0.1278, id: "London"},
  {latitude: 55.7558, longitude:   37.6173, id: "Moscow"},
  {latitude: 47.7511, longitude: -120.7401, id: "Washington"},
  {latitude: 39.5501, longitude: -105.7821, id: "Colorado"},
  {latitude: 30.2672, longitude:  -97.7431, id: "Austin"},
  {latitude: 45.5017, longitude:  -73.5673, id: "Montreal"},
  {latitude: 52.9399, longitude:  -73.5491, id: "Québec"},
  {latitude: 25.7617, longitude:  -80.1918, id: "Miami"}
];
const TimeString = '*/2 * * * *';


function darkSkyJob() {
  console.log("\x1b[37m", `${getDate()}: DarkSky Job Started`);
  Cordinates.forEach( c => {
    let reqest = `https://api.darksky.net/forecast/${darkSkyKey}/${c.latitude},${c.longitude}`
    axios.get(reqest).then( response => {
      if(response.status == 200){
          FBCityKey = db.ref(`DarkSky/${c.id}/${response.data.currently.time}`);
          FBCityKey.set(response.data, error => {
            if(error)
              console.log("\x1b[31m", `[✕] ${getDate()}: DarkSky: ${c.id} Status: ${error}`);
            else
              console.log("\x1b[32m", `[✓] ${getDate()}: DarkSky: ${c.id} Status: ${response.status}`);
          });
        } else {
          console.log("\x1b[31m", `[✕] ${getDate()}: DarkSky: ${c.id} Status: ${response.status}`);
        }
      }).catch( error => {
        console.error("\x1b[31m", `[✕] ${getDate()}: Unable to reach DarySky, ${c.id} request ${error}`);
      })
  })
}


function weatherUndergroundJob() {
  console.log("\x1b[37m", `${getDate()}: WeatherUnderground job Started`);
  Cordinates.forEach( c => {
    let reqest = `http://api.wunderground.com/api/${weatherUndergroundKey}/conditions/forecast10day/q/${c.latitude},${c.longitude}.json`
    axios.get(reqest).then( response => {
      if(response.status == 200){
          FBCityKey = db.ref(`WeatherUnderground/${c.id}/${response.data.current_observation.local_epoch}`);
          FBCityKey.set(response.data, error => {
            if (error)
              console.log("\x1b[31m", `[✕] ${getDate()}: FCM WeatherUnderground: ${c.id} Status: ${error}`);
            else
              console.log("\x1b[32m", `[✓] ${getDate()}: WeatherUnderground: ${c.id} Status: ${response.status}`);
          })
        } else {
          console.log("\x1b[31m", `[✕] ${getDate()}: WeatherUnderground: ${c.id} Status: ${response.status}`);
        }
      }).catch( error => {
        console.error("\x1b[31m", `[✕] ${getDate()}: Unable to reach WeatherUnderground, ${c.id} request ${error}`);
      })
  })
}

WeatherUnderground = new CronJob(TimeString, weatherUndergroundJob, null , true, null, null, this, true);
DarkSky = new CronJob(TimeString, darkSkyJob, null , true, null, null, this, true);
