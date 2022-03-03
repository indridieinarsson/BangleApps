//ble = (function () {
// 1/4 : String.fromCharCode(188)
// 2/4 : String.fromCharCode(189)
// 3/4 : String.fromCharCode(190)
baro = {};
baro.draw = function draw(x,y,Radius, Settings) {
    let halfScreenWidth   = g.getWidth() / 2;
    let largeComplication = (x === halfScreenWidth);
    g.setColor(Settings.Foreground === 'Theme' ? g.theme.fg : Settings.Foreground || '#000000');
    g.setFont('Vector', 18);
    g.setFontAlign(0,0);
    dp = Math.round(WIDGETS.widbarom.getChange() * 10) / 10;
    p = Math.round(WIDGETS.widbarom.getLastPressure().pressure);
    dpsign = (dp<0?"":"+") + dp;
    Text = ''+p+dpsign+"Hp";
    g.drawString(Text, x,y);
};

sunrise = {};
sunrise.quarters = [0, String.fromCharCode(188), String.fromCharCode(189), String.fromCharCode(190), 0];

sunrise.compactTime = function(t) {
    return ''+t.getHours()+this.quarters[Math.round(t.getMinutes()/15)];
};

function drawEvent(ev, x, y, Radius, Settings) {
    auxdial = require("https://raw.githubusercontent.com/indridieinarsson/espruino_sandbox/master/auxdial.js");
    let halfScreenWidth   = g.getWidth() / 2;
    let largeComplication = (x === halfScreenWidth);
    g.setColor(Settings.Foreground === 'Theme' ? g.theme.fg : Settings.Foreground || '#000000');
    g.setFont('Vector', 18);
    g.setFontAlign(0,0);
    let h = ieclock[ev].getHours()
    let m = ieclock[ev].getMinutes()
    auxdial.draw(Settings, x, y, Radius+1,h ,m , true);
    // Text = this.compactTime(ieclock.sunrise);
    // g.drawString(Text, x,y);
}

sunrise.draw = drawEvent.bind(this, 'sunrise');

sunrise.whichevent = function whichevent (ev) {
    return { draw:drawEvent.bind(this,ev) };
  };

require('https://raw.githubusercontent.com/rozek/banglejs-2-widgets-on-background/main/drawWidgets.js');

let Clockwork = require('https://raw.githubusercontent.com/rozek/banglejs-2-simple-clockwork/main/Clockwork.js');

Clockwork.windUp({
    face:require('https://raw.githubusercontent.com/rozek/banglejs-2-twelve-numbered-clock-face/main/ClockFace.js'),
    size: require('https://raw.githubusercontent.com/rozek/banglejs-2-smart-clock-size/main/ClockSize.js'),
    hands: require('https://raw.githubusercontent.com/rozek/banglejs-2-hollow-clock-hands/main/ClockHands.js'),
    complications: {
        l:sunrise.whichevent('sunrise'),
        r:sunrise.whichevent('sunset'),
        t:require('https://raw.githubusercontent.com/rozek/banglejs-2-date-complication/main/Complication.js'),
        b:baro
    }
}, {'Foreground':'Theme', 'Background':'Theme'});
