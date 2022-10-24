(function () { 
  function updateSunRiseSunSet(){
    var SunCalc = require("https://raw.githubusercontent.com/mourner/suncalc/master/suncalc.js");
    let now=Date();
    let location = require("Storage").readJSON(ieclock.LOCATION_FILE,1)||{};
    location.lat = location.lat||51.5072;
    location.lon = location.lon||0.1276;
    location.location = location.location||"London";
    let times = SunCalc.getTimes(new Date(), location.lat, location.lon);
    global.ieclock.times = times;
    global.ieclock.sunrise = times.sunrise;
    global.ieclock.sunset = times.sunset;
  }

  function updateTide() {
    let tideinfo, laste;
    let nowT=Date().getTime();
    let f = require("Storage").read(global.ieclock.TIDE_FILE);
    if (typeof f == 'undefined'){
      return;
    }
    f=f.split(";");
    for (var ix in f){
      let e = f[ix].split(",");
      if(e[0] > nowT){
        tideinfo = e;
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
    global.ieclock.tides = {
      'time': Date(parseInt(tideinfo[0])),
      'timestamp':parseInt(tideinfo[0]),
      'e':tideinfo,
      'height':Math.round(parseInt(tideinfo[1])/10)/10,
      'lastheight':Math.round(parseInt(laste[1])/10)/10, 
      'timelast':parseInt(laste[0]),
      'high':(tideinfo[2]=='true'?true:false)
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

  global.ieclock.intervaldId = setInterval(function() {
    updateSunRiseSunSet();
    updateTide();
  }, 1000*60*60*2); // update occasionally
})();
