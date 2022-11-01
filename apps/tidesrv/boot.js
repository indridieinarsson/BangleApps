(function () { 
  function updateSunRiseSunSet(){
    var SunCalc = require("https://raw.githubusercontent.com/mourner/suncalc/master/suncalc.js");
    let now=Date();
    let location = require("Storage").readJSON(tidesrv.LOCATION_FILE,1)||{};
    location.lat = location.lat||51.5072;
    location.lon = location.lon||0.1276;
    location.location = location.location||"London";
    let times = SunCalc.getTimes(new Date(), location.lat, location.lon);
    tidesrv.times = times;
    tidesrv.sunrise = times.sunrise;
    tidesrv.sunset = times.sunset;
  }

  function refreshTideFile() {
    let settings = require('Storage').readJSON("tidesrv.json", true) || {};
    let tidesite = settings.tidesite || 'reykjavik';
    delete settings; // remove unneeded settings from memory

    let now = new Date();
    let start = new Date(now-24*60*60*1000);
    let end = new Date(now+24*60*60*1000*30);
    let str = 'https://tideapi.spliff-donk.de/stations/table?stationid='+tidesite+'&startdate='+start.getFullYear()+'-'+(start.getMonth()+1)+'-'+start.getDate()+'&enddate='+end.getFullYear()+'-'+(end.getMonth()+1)+'-'+end.getDate();
    Bangle.http(str).then(data=>{
      require("Storage").write(tidesrv.TIDE_FILE, data.resp);
    });
  }

  function updateTide() {
    nowT=Date().getTime();
    f = require("Storage").read(tidesrv.TIDE_FILE);
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
    global.tidesrv.tides = {
      'time': Date(parseInt(e[0])),
      'timestamp':parseInt(e[0]),
      'e':e,
      'height':th,
      'lastheight':thlast, 
      'timelast':parseInt(laste[0]),
      'high':(e[2]=='true'?true:false)
    };
  }

  global.tidesrv = {
    sunrise: Date(),
    sunset: Date(),
    location: {},
    times: {},
    tides: {},
    LOCATION_FILE: "mylocation.json",
    TIDE_FILE: "tides.data.csv",
    intervalId: -1,
    updateTide: updateTide,
    updateSunRiseSunSet: updateSunRiseSunSet,
    refreshTideFile: refreshTideFile
  }; 

  updateSunRiseSunSet();
  updateTide();

  tidesrv.intervaldId = setInterval(function() {
    updateSunRiseSunSet();
    updateTide();
  }, 1000*60*60*2); // update occasionally
})();
