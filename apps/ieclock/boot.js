function updateSunRiseSunSet(){
    var SunCalc = require("https://raw.githubusercontent.com/mourner/suncalc/master/suncalc.js");
    let now=Date();
    let location = require("Storage").readJSON(ieclock.LOCATION_FILE,1)||{};
    location.lat = location.lat||51.5072;
    location.lon = location.lon||0.1276;
    location.location = location.location||"London";
    let times = SunCalc.getTimes(new Date(), location.lat, location.lon);
    ieclock.times = times;
    ieclock.sunrise = times.sunrise;
    ieclock.sunset = times.sunset;
}

function updateTide() {
    nowT=Date().getTime();
    f = require("Storage").read(ieclock.TIDE_FILE);
    f=f.split("\n");
    for (ix in f)
    {
        e = f[ix].split(",");
        t = e[0];
        if(t > nowT){
            tideinfo = e;
            break;
        }
    }
    ieclock.tides = {'time': Date(e[0]), 'height': e[1]/100.0, 'high': e[2]}
}

global.ieclock = {
    sunrise: Date(),
    sunset: Date(),
    location: {},
    times: {},
    tides: {},
    LOCATION_FILE: "mylocation.json",
    TIDE_FILE: "tides.data.csv",
    intervalId: -1 
} 

updateSunRiseSunSet();
updateTide();

ieclock.intervaldId = setInterval(function() {
    updateSunRiseSunSet();
    updateTide();
}, 1000*60*60*24); // update daily
