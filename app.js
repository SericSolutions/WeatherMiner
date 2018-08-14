const axios = require('axios');
const CronJob = require('cron').CronJob;
const admin = require("firebase-admin");
var serviceAccount = require("./firebase-adminsd.json");

function getDate(){
  return new Date(Date.now()).toLocaleString();
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://wtadashboard-e3345.firebaseio.com/"
});
var db = admin.database();


const darkSkyKey = "37b8356444fc0bfc5d7cc6c1b1f9958c";
const weatherUndergroundKey = "85590f6b6fc6bcd1";
const accuWeatherKeys = ["AFNJzQOo0rVoKjEDGUhhMo3RftTxQWvy",
  "9lvAxpcHyqI5uadIKUmsUwbh7sBpRVVw", 
  "Mda7nDkkFpi8wj8uQwQVmkZtqGGYSpfJ"]
const TimeString = '0 */6 * * *';

var Coordinates = [];

function darkSkyJob() {
  console.log("\x1b[37m", `${getDate()}: DarkSky Job Started`);
  Coordinates.forEach( c => {
    let reqest = `https://api.darksky.net/forecast/${darkSkyKey}/${c.latitude},${c.longitude}`
    axios.get(reqest).then( response => {
      if(response.status == 200){
          FBCityKey = db.ref(`DarkSky/${c.id}/${Date.now()}`);
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
  console.log("\x1b[37m", `${getDate()}: WeatherUnderground Job Started`);
  Coordinates.forEach( c => {
    let reqest = `https://api-ak-aws.wunderground.com/api/85590f6b6fc6bcd1/forecast10day/hourly10day/conditions/alerts/lang:EN/units:metric/v:2.0${c.zmw}.json`
    axios.get(reqest).then( response => {
      if(response.status == 200){
          FBCityKey = db.ref(`WeatherUnderground/${c.id}/${Date.now()}`);
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

function weatherUndergroundLegacyJob() {
  console.log("\x1b[37m", `${getDate()}: WeatherUndergroundLegacy Job Started`);
  Coordinates.forEach( c => {
    let reqest = `http://api.wunderground.com/api/${weatherUndergroundKey}/conditions/forecast10day/q/${c.latitude},${c.longitude}.json`
    axios.get(reqest).then( response => {
      if(response.status == 200){
          FBCityKey = db.ref(`WeatherUndergroundLegacy/${c.id}/${Date.now()}`);
          FBCityKey.set(response.data, error => {
            if (error)
              console.log("\x1b[31m", `[✕] ${getDate()}: FCM WeatherUndergroundLegacy: ${c.id} Status: ${error}`);
            else
              console.log("\x1b[32m", `[✓] ${getDate()}: WeatherUndergroundLegacy: ${c.id} Status: ${response.status}`);
          })
        } else {
          console.log("\x1b[31m", `[✕] ${getDate()}: WeatherUndergroundLegacy: ${c.id} Status: ${response.status}`);
        }
      }).catch( error => {
        console.error("\x1b[31m", `[✕] ${getDate()}: Unable to reach WeatherUndergroundLegacy, ${c.id} request ${error}`);
      })
  })
}

function AccuWeatherJob() {
  console.log("\x1b[37m", `${getDate()}: AccuWeather Job Started`);
  Coordinates.forEach( (c, i) => {
    let reqest = 'http://dataservice.accuweather.com/forecasts/v1/daily/5day/' +
      `${c.awk}?apikey=${accuWeatherKeys[i%3]}&details=true&metric=true`
    console.log(i%3, reqest);
    axios.get(reqest).then( response => {
      if(response.status == 200){
          FBCityKey = db.ref(`AccuWeather/${c.id}/${Date.now()}`);
          FBCityKey.set(response.data, error => {
            if (error)
              console.log("\x1b[31m", `[✕] ${getDate()}: FCM AccuWeather: ${c.id} Status: ${error}`);
            else
              console.log("\x1b[32m", `[✓] ${getDate()}: AccuWeather: ${c.id} Status: ${response.status}`);
          })
        } else {
          console.log("\x1b[31m", `[✕] ${getDate()}: AccuWeather: ${c.id} Status: ${response.status}`);
        }
      }).catch( error => {
        console.error("\x1b[31m", `[✕] ${getDate()}: Unable to reach AccuWeather, ${c.id} request ${error}`);
      })
  })
}

db.ref('/Stations').once('value', snapshot => {
  console.log("Server Started");
  let data = snapshot.val();
  Coordinates = [];
  for (key in data) {
    Coordinates.push(data[key]);
  }
  WeatherUnderground = new CronJob(TimeString, weatherUndergroundJob, null , true, null, null, this, true);
  DarkSky = new CronJob(TimeString, darkSkyJob, null , true, null, null, this, true);
  WeatherUndergroundLegacy = new CronJob(TimeString, weatherUndergroundLegacyJob, null , true, null, null, this, true);
  AccuWeather = new CronJob(TimeString, AccuWeatherJob, null , true, null, null, this, true);
})


db.ref('/Stations').on('value', snapshot => {
  let data = snapshot.val();
  Coordinates = [];
  for (key in data) {
    Coordinates.push(data[key]);
  }
  console.log("Coordinates updated");
})
