function updateSunRiseSunSet(){
    var SunCalc = require("https://raw.githubusercontent.com/mourner/suncalc/master/suncalc.js");
    let now=Date();
    let location = require("Storage").readJSON(ieclock.LOCATION_FILE,1)||{};
    location.lat = location.lat||51.5072;
    location.lon = location.lon||0.1276;
    location.location = location.location||"London";
    // get today's sunlight times for lat/lon
    let times = SunCalc.getTimes(new Date(), location.lat, location.lon);
    // format sunrise time from the Date object
    ieclock.sunrise = extractTime(times.sunrise);
    ieclock.sunset = extractTime(times.sunset);
}

global.ieclock = {
    sunrise: Date(),
    sunset: Date(),
    location: {},
    LOCATION_FILE: "mylocation.json",
    intervalId: -1 
} 

updateSunRiseSunSet();

ieclock.intervaldId = setInterval(function() {
    updateSunRiseSunSet();
}, 1000*60*60*24); // update daily
