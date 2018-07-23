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
const TimeString = '*/30 * * * *';

var Coordinates = [];

function darkSkyJob() {
  console.log("\x1b[37m", `${getDate()}: DarkSky Job Started`);
  Coordinates.forEach( c => {
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
  Coordinates.forEach( c => {
    let reqest = `https://api-ak-aws.wunderground.com/api/85590f6b6fc6bcd1/forecast10day/hourly10day/conditions/alerts/lang:EN/units:metric/v:2.0${c.zmw}.json`
    axios.get(reqest).then( response => {
      if(response.status == 200){
          FBCityKey = db.ref(`WeatherUnderground/${c.id}/${response.data.current_observation.date.epoch}`);
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

db.ref('/Stations').once('value', snapshot => {
  console.log("Server Started");
  let data = snapshot.val();
  Coordinates = [];
  for (key in data) {
    Coordinates.push(data[key]);
  }
  WeatherUnderground = new CronJob(TimeString, weatherUndergroundJob, null , true, null, null, this, true);
  DarkSky = new CronJob(TimeString, darkSkyJob, null , true, null, null, this, true);
})


db.ref('/Stations').on('value', snapshot => {
  let data = snapshot.val();
  Coordinates = [];
  for (key in data) {
    Coordinates.push(data[key]);
  }
  console.log("Coordinates updated");
})
