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
    if (typeof f == 'undefined'){
        return;
    }
    f=f.split(";");
    for (ix in f)
    {
        e = f[ix].split(",");
        t = e[0];
        if(t > nowT){
            var tideinfo = e;
            var lasttide = laste;
            break;
        }
        laste = e;
    }
    if (typeof tideinfo == 'undefined'){
        return;
    }
    if (typeof laste == 'undefined'){
        return;
    }
    th = Math.round(parseInt(e[1])/10)/10;
    thlast = Math.round(parseInt(laste[1])/10)/10;
    ieclock.tides = {
        'time': Date(parseInt(e[0])),
        'timestamp':parseInt(e[0]),
        'e':e,
        'height':th,
        'lastheight':thlast, 
        'timelast':parseInt(laste[0]),
        'high':(e[2]=='true'?true:false)
    };
}

global.ieclock = {
    sunrise: Date(),
    sunset: Date(),
    location: {},
    times: {},
    tides: {},
    LOCATION_FILE: "mylocation.json",
    TIDE_FILE: "tides.data.csv",
    intervalId: -1,
    updateTide: updateTide,
    updateSunRiseSunSet: updateSunRiseSunSet
}; 

updateSunRiseSunSet();
updateTide();

ieclock.intervaldId = setInterval(function() {
    updateSunRiseSunSet();
    updateTide();
}, 1000*60*60*2); // update occasionally
