//ble = (function () {
// 1/4 : String.fromCharCode(188)
// 2/4 : String.fromCharCode(189)
// 3/4 : String.fromCharCode(190)
//
function log_debug(o) {
  //print(o);
}

baro = {};
baro.draw = function draw(x,y,Radius, Settings) {
    try {
        g.setColor(Settings.Foreground === 'Theme' ? g.theme.fg : Settings.Foreground || '#000000');
        g.setFont('Vector', 18);
        g.setFontAlign(0,0);
        dp = WIDGETS.widbarom.getChange().toFixed(1) ;
        p = Math.round(WIDGETS.widbarom.getLastPressure().pressure);
        dpsign = (dp<0?"":"+") + dp;
        Text = ''+p+dpsign+"Hp";
        g.drawString(Text, x,y);
    } catch (error) {
        //console.error(error)
    }
};


let ClockSize = require('https://raw.githubusercontent.com/rozek/banglejs-2-smart-clock-size/main/ClockSize.js');
baro2 = {};
baro2.ClockSize = ClockSize;
baro2.draw = function draw(x,y,Radius, Settings){
    g.setColor(Settings.Foreground === 'Theme' ? g.theme.fg : Settings.Foreground || '#000000');
    cx = this.ClockSize.CenterX();
    cy = this.ClockSize.CenterY();
    rad = this.ClockSize.outerRadius();
    halfdial = require("https://raw.githubusercontent.com/indridieinarsson/espruino_sandbox/master/halfdial.js");
    p = Math.round(WIDGETS.widbarom.getLastPressure().pressure);
    k=(p-950)/100;
    halfdial.draw(Settings, cx, cy, rad-27, k);
    dp = WIDGETS.widbarom.getChange();
    let t1=dp.toFixed(0);
    let t2=((Math.abs(dp)%1)*10).toFixed();
    g.setColor(Settings.Foreground === 'Theme' ? g.theme.fg : Settings.Foreground || '#000000');
    g.setFont('Vector',16);
    g.setFontAlign(1,1);
    g.drawString((t1<0?"":"+") + t1,x+8,y+8);
    g.setFont('Vector',12);
    g.setFontAlign(0,0);
    g.drawString(t2,x+8,y+8);
    // dpsign = (dp<0?"":"+") + dp;
    // Text = ''+dpsign+"Hp";
    // g.drawString(Text, x,y);
}


sunrise = {};
sunrise.quarters = [0, String.fromCharCode(188), String.fromCharCode(189), String.fromCharCode(190), 0];

sunrise.compactTime = function(t) {
    return ''+t.getHours()+this.quarters[Math.round(t.getMinutes()/15)];
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
    auxdial = require("https://raw.githubusercontent.com/indridieinarsson/espruino_sandbox/master/auxdial.js");
    let rmult = (largeComplication?1.7:1.3);
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
    if (largeComplication){
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
    }
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
    let rmult = (largeComplication?1.65:1.3);
    auxdial = require("https://raw.githubusercontent.com/indridieinarsson/espruino_sandbox/master/auxdial.js");
    g.setColor(Settings.Foreground === 'Theme' ? g.theme.fg : Settings.Foreground || '#000000');
    let h = ieclock[ev].getHours();
    let m = ieclock[ev].getMinutes();
    auxdial.draw(Settings, x, y, Math.round(Radius*rmult),h ,m , true);
}

sunrise.draw = drawEvent.bind(this, 'sunrise');

sunrise.whichevent = function whichevent (ev) {
    return { draw:drawEvent.bind(this,ev) };
};

require('https://raw.githubusercontent.com/rozek/banglejs-2-widgets-on-background/main/drawWidgets.js');
let Clockwork = require('https://raw.githubusercontent.com/rozek/banglejs-2-simple-clockwork/main/Clockwork.js');

Clockwork.windUp({
    face:require('https://raw.githubusercontent.com/rozek/banglejs-2-twelve-numbered-clock-face/main/ClockFace.js'),
    size:ClockSize,
    hands: require('https://raw.githubusercontent.com/rozek/banglejs-2-hollow-clock-hands/main/ClockHands.js'),
    complications: {
        l:sunrise.whichevent('sunrise'),
        r:sunrise.whichevent('sunset'),
        t:tide,
        b:baro2
    }
}, {'Foreground':'Theme', 'Background':'Theme'});
