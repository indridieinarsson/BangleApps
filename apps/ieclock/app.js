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
  Text = ''+dp+"Hp";
};

require('https://raw.githubusercontent.com/rozek/banglejs-2-widgets-on-background/main/drawWidgets.js');

let Clockwork = require('https://raw.githubusercontent.com/rozek/banglejs-2-simple-clockwork/main/Clockwork.js');

Clockwork.windUp({
    size: require('https://raw.githubusercontent.com/rozek/banglejs-2-smart-clock-size/main/ClockSize.js'),
    complications: {
        l:require('https://raw.githubusercontent.com/rozek/banglejs-2-weekday-complication/main/Complication.js'),
        r:require('https://raw.githubusercontent.com/rozek/banglejs-2-moon-phase-complication/main/Complication.js'),
        t:require('https://raw.githubusercontent.com/rozek/banglejs-2-date-complication/main/Complication.js'),
        b:baro
  }
});
