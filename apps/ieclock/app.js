function log_debug(o) {
  //print(o);
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
    //updateSunRiseSunSet(new Date(), location.lat, location.lon);
    let halfScreenWidth   = g.getWidth() / 2;
    let largeComplication = (x === halfScreenWidth);
    auxdial = require("https://raw.githubusercontent.com/indridieinarsson/espruino_sandbox/master/24hAuxDial.js");
    let rmult = (largeComplication?1.7:1.35);
    let h1 = tidesrv.times.dawn.getHours();
    let m1 = tidesrv.times.dawn.getMinutes();
    let h2 = tidesrv.times.dusk.getHours();
    let m2 = tidesrv.times.dusk.getMinutes();
    auxdial.draw(Settings, x, y, Math.round(Radius*rmult), h1 ,m1 , h2, m2);
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
    if (typeof tidesrv == 'undefined')
    {
        return;
    }
    if (typeof tidesrv.tides == 'undefined')
    {
        return;
    }
    if (typeof tidesrv.tides.height == 'undefined' || typeof tidesrv.tides.time == 'undefined' )
    {
        return;
    }
    let h1 = tidesrv.tides.time.getHours();
    let m1 = tidesrv.tides.time.getMinutes();
    let tlast = Date(tidesrv.tides.timelast);
    let h2 = tlast.getHours();
    let m2 = tlast.getMinutes();
	
    if (tidesrv.tides.high) {
        auxdial.draw(Settings, x, y, Math.round(Radius*rmult),h2 ,m2 , h1, m1);
    }else {
        auxdial.draw(Settings, x, y, Math.round(Radius*rmult),h1 ,m1 , h2, m2);
    }
    // if (largeComplication){
    let th = tidesrv.tides.height;
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
