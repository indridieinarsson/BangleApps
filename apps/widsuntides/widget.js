
WIDGETS = {}; // <-- for development only
(() => {
  var width = 24; // width of the widget
  var currentPressure={'time':Date(), 'pressure':0};
  var lastPressure={'time':Date(Date().getTime()-1000), 'pressure':0};
  var nTide={};
  function draw() {
    // DO nothing, a pure background widget
  }

    function updateData() {
        nowT=Date("2022-02-28").getTime();
        var f = require("Storage").read("tides.data.csv").split(";");
        for (var ix in f) {
            e = f[ix].split(",");
            t = parseInt(e[0]);
            if(t > nowT){
                dt = Date(parseInt(e[0]));
                nTide = {'date': dt, 'level':parseInt(e[1])/100, 'hightide':e[2] === 'true'};
                break;
            }
        }
    }

    function updateSunRiseSunSet(now, lat, lon, line){
        var SunCalc = require("https://raw.githubusercontent.com/mourner/suncalc/master/suncalc.js");
        // get today's sunlight times for lat/lon
        var times = SunCalc.getTimes(new Date(), lat, lon);

        // format sunrise time from the Date object
        sunRise = extractTime(times.sunrise);
        sunSet = extractTime(times.sunset);
    }

  function getNextTide(){
    return nTide;
  }

  setInterval(function() {
    WIDGETS["widsuntides"].updateData(WIDGETS["widsuntides"]);
  }, 1*6000); // update every 0.1 minutes

  // add your widget
  WIDGETS["widsuntides"]={
    area:"tl", // tl (top left), tr (top right), bl (bottom left), br (bottom right)
    width: width, // how wide is the widget? You can change this and call Bangle.drawWidgets() to re-layout
    draw:draw, // called to draw the widget
    updateData:updateData,
    getNextTide: getNextTide
  };
})();
Bangle.drawWidgets(); // <-- for development only
