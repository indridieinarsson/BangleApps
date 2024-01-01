var SunCalc = require("https://raw.githubusercontent.com/mourner/suncalc/master/suncalc.js");
const LOCATION_FILE = "mylocation.json";
var location;
var sunRise;
var sunSet;
//ble = (function () {
// 1/4 : String.fromCharCode(188)
// 2/4 : String.fromCharCode(189)
// 3/4 : String.fromCharCode(190)
//
function log_debug(o) {
  //print(o);
}

function loadLocation() {
  location = require("Storage").readJSON(LOCATION_FILE,1)||{};
  location.lat = location.lat||51.5072;
  location.lon = location.lon||0.1276;
  location.location = location.location||"London";
}

function updateSunRiseSunSet(now, lat, lon, line){
  // get today's sunlight times for lat/lon
  let times = SunCalc.getTimes(new Date(), lat, lon);
  // format sunrise time from the Date object
  sunRise = times.sunrise;
  sunSet = times.sunset;
}

let ClockSize = require('https://raw.githubusercontent.com/indridieinarsson/espruino_sandbox/master/ClockSize.js');

var timeCompact={};
timeCompact.quarters = [0, String.fromCharCode(188), String.fromCharCode(189), String.fromCharCode(190), 0];
timeCompact.compactTime = function(t) {
    return ''+t.getHours()+this.quarters[Math.round(t.getMinutes()/15)];
};

sunrise = {};

sunrise.quarters = [0, String.fromCharCode(188), String.fromCharCode(189), String.fromCharCode(190), 0];

sunrise.compactTime = function(t) {
    return ''+t.getHours()+this.quarters[Math.round(t.getMinutes()/15)];
};

sunrise.draw = function(x, y, Radius, Settings) {
    loadLocation();
    updateSunRiseSunSet(new Date(), location.lat, location.lon);
    let halfScreenWidth   = g.getWidth() / 2;
    let largeComplication = (x === halfScreenWidth);
    auxdial = require("https://raw.githubusercontent.com/indridieinarsson/espruino_sandbox/master/24hAuxDial.js");
    let rmult = (largeComplication?1.7:1.35);
	let h1 = sunRise.getHours();
	let m1 = sunRise.getMinutes();
	let h2 = sunSet.getHours();
	let m2 = sunSet.getMinutes();
    auxdial.draw(Settings, x, y, Math.round(Radius*rmult), h1 ,m1 , true);

    // let Text = this.compactTime(sunRise);
    // g.setColor(Settings.Foreground === 'Theme' ? g.theme.fg : Settings.Foreground || '#000000');
    // g.setFont('Vector', 16);
    // g.setFontAlign(0,0);
    // g.drawString(Text, x, y);
};

tide = {};

tide.quarters = [0, String.fromCharCode(188), String.fromCharCode(189), String.fromCharCode(190), 0];

tide.compactTime = function(t) {
    return ''+t.getHours()+this.quarters[Math.round(t.getMinutes()/15)];
};

tide.draw = function(x, y, Radius, Settings) {
    log_debug("x "+x+" y "+y+" r "+Radius+ " Settings "+Settings);
    let halfScreenWidth   = g.getWidth() / 2;
    let largeComplication = (x === halfScreenWidth);
    auxdial = require("https://raw.githubusercontent.com/indridieinarsson/espruino_sandbox/master/24hAuxDial.js");
    let rmult = (largeComplication?1.7:1.35);
    if (typeof ieclock == 'undefined')
    {
        return;
    }
    if (typeof ieclock.tides == 'undefined')
    {
        return;
    }
    if (typeof ieclock.tides.height == 'undefined' || typeof ieclock.tides.time == 'undefined' )
    {
        return;
    }
    let h = ieclock.tides.time.getHours();
    let m = ieclock.tides.time.getMinutes();
    auxdial.draw(Settings, x, y, Math.round(Radius*rmult),h ,m , true);
    // if (largeComplication){
	let th = ieclock.tides.height;
        let t1=th.toFixed(0);
        let t2=((Math.abs(th)%1)*10).toFixed();
        g.setColor(Settings.Foreground === 'Theme' ? g.theme.fg : Settings.Foreground || '#000000');
        g.setFont('Vector',16);
        g.setFontAlign(1,1);
        g.drawString(t1,x+8,y+8);
        g.setFont('Vector',12);
        g.setFontAlign(0,0);
        g.drawString(t2,x+8,y+8);
    // }
    // let Text = this.compactTime(ieclock.tides.time);
    // if (largeComplication){
    //     Text = Text+" "+ieclock.tides.height.toFixed(1)+"m";
    // }
    // g.setColor(Settings.Foreground === 'Theme' ? g.theme.fg : Settings.Foreground || '#000000');
    // g.setFont('Vector', 16);
    // g.setFontAlign(0,0);
    // g.drawString(Text, x, y);
};

// tideheight = {};
// tideheight.draw = function() {
//     g.setColor(Settings.Foreground === 'Theme' ? g.theme.fg : Settings.Foreground || '#000000');
//     g.setFont('Vector', 18);
//     g.setFontAlign(0,0);
//     Text = ''+ieclock.tides.height+'m';
//     g.drawString(Text, x,y);
// }

function drawEvent(ev, x, y, Radius, Settings) {
    let halfScreenWidth   = g.getWidth() / 2;
    let largeComplication = (x === halfScreenWidth);
    let rmult = (largeComplication?1.65:1.35);
    auxdial = require("https://raw.githubusercontent.com/indridieinarsson/espruino_sandbox/master/24hAuxDial.js");
    g.setColor(Settings.Foreground === 'Theme' ? g.theme.fg : Settings.Foreground || '#000000');
    let h = ieclock[ev].getHours();
    let m = ieclock[ev].getMinutes();
    auxdial.draw(Settings, x, y, Math.round(Radius*rmult),h ,m , true);
}

// sunrise.draw = drawEvent.bind(this, 'sunrise');
//
// sunrise.whichevent = function whichevent (ev) {
//     return { draw:drawEvent.bind(this,ev) };
// };

let Clockwork = require('https://raw.githubusercontent.com/indridieinarsson/espruino_sandbox/master/Clockwork.js');

Clockwork.windUp({
    face:require('https://raw.githubusercontent.com/indridieinarsson/espruino_sandbox/master/ClockFace.js'),
    size:ClockSize,
    hands: require('https://raw.githubusercontent.com/indridieinarsson/espruino_sandbox/master/ClockHands.js'),
    complications: {
        // r:sunrise.whichevent('sunset'),
	t:require('https://raw.githubusercontent.com/rozek/banglejs-2-moon-phase-complication/main/Complication.js'),
        l:tide,
        // r:sunrise.whichevent('sunrise'),
        r:sunrise,
	b:require('https://raw.githubusercontent.com/rozek/banglejs-2-date-complication/main/Complication.js'),
    }
}, {'Foreground':'Theme', 'Background':'Theme', 'ArmsColor':'#00FFFF'});
