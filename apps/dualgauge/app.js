var SunCalc = require("https://raw.githubusercontent.com/mourner/suncalc/master/suncalc.js");
const storage = require('Storage');
const locale = require("locale");
const SETTINGS_FILE = "dualgauge.json";
const LOCATION_FILE = "mylocation.json";
const h = g.getHeight();
const w = g.getWidth();
const rad = 16;
const th = 3;
const bl = Math.round(0.5*Math.PI*rad);
const halflength = (w/2-rad) + bl + (h-rad-rad) + bl + (w/2-rad);
const n_hbl = Math.round((w/2-rad)/bl);
const n_bl = Math.round((w-2*rad)/bl);
const showtides = true;

let settings;
let location;

// variable for controlling idle alert
let lastStep = getTime();
let warned = 0;
let idle = false;
let IDLE_MINUTES = 26;

const infoLine = (3*h/4) - 6;
const infoWidth = 56;
const infoHeight = 11;
var drawingSteps = false;
var tide = {};

var timeCompact={};
timeCompact.quarters = [0, String.fromCharCode(188), String.fromCharCode(189), String.fromCharCode(190), 0];
timeCompact.compactTime = function(t) {
    return ''+t.getHours()+this.quarters[Math.round(t.getMinutes()/15)];
};

function log_debug(o) {
  //print(o);
}

function getTideHeight(nowt){
  dt=ieclock.tides.timestamp-ieclock.tides.timelast;
  nowscale = (nowt-ieclock.tides.timelast)*MathPI/dt;
  c = -ieclock.tides.high*Math.cos(nowscale);
  if (!ieclock.tides.high)
    c=-c;
  rng = (ieclock.tides.height-ieclock.tides.lastheight)/2;
  return rng+ieclock.tides.lastheight + c*rng;
}

function find_split_segment(csseg, nrtf){
    for (var i = 0; i < csseg.length; i++) {
        if (nrtf < csseg[i]){
            return i;
        }
    }
    return csseg.length;
}

function cumsum(segs) {
    retval = [];
    segs.forEach(function(nr, ix){
        if (ix==0) {
            retval.push(nr);
        }
        else {
            retval.push(nr+retval[ix-1]);
        }
    });
    return retval;
}

// construct length of all segments:
function get_cumlength(l, n_bl, nrs){
    lengths = nrs.map(x => Math.round((x+1)*l/n_bl) - Math.round(x*l/n_bl));
    all_lengths = [];
    all_lengths=all_lengths.concat(lengths.slice(n_hbl,n_bl));
    all_lengths.push(bl);
    all_lengths=all_lengths.concat(lengths);
    all_lengths.push(bl);
    all_lengths=all_lengths.concat(lengths.slice().reverse().slice(n_hbl,n_bl));
    return cumsum(all_lengths);
}

function thickring(x,y, r, th, color){
    g.setColor(color);
    g.fillCircle(x,y,r);
    g.setColor(g.theme.bg);
    g.fillCircle(x,y,r-th-1);
}
function topleft(color){
    thickring(0+rad  ,0+rad  , rad, th, color);
}
function topright(color){
    thickring(w-rad-2,0+rad  , rad, th, color);
}
function bottomleft(color){
    thickring(0+rad  ,h-rad-2, rad, th, color);
}
function bottomright(color){
    thickring(w-rad-2,h-rad-2, rad, th, color);
}


function drawGauge(percL, percR){
    // g.setColor(g.theme.fg);
    // bogalengd : 2*pi*rad/4 = 
    tarcnr = n_hbl;
    barcnr = tarcnr + n_bl+1;

    nrs = [];
    for (var i=0; i<n_bl; i++){
        nrs.push(i);
    }

    l = w-2*rad-2;
    intervals = nrs.map(x => [rad+Math.round(x*l/n_bl), rad+Math.round((x+1)*l/n_bl)]);
    cumsum_all = get_cumlength(l, n_bl, nrs);
    maxPixels=cumsum_all[cumsum_all.length - 1];
    nrtofindR = Math.round(percR*maxPixels/100);
    gaugePosR = find_split_segment(cumsum_all, nrtofindR);

    nrtofindL = Math.round(percL*maxPixels/100);
    gaugePosL = find_split_segment(cumsum_all, nrtofindL);

    r_intervals = intervals.slice(n_hbl, n_bl);
    l_intervals = intervals.slice(0, n_hbl);
    r_rects=[];

    r_intervals.forEach(it => {
        tmp=[it[0], 0, it[1], th];
        r_rects.push(tmp);
    });
    // Right
    intervals.forEach(it => {
        r_rects.push([w-th-2, it[0], w, it[1]]);
    });
    // Bottom
    r_intervals.slice().reverse().forEach(it => {
        r_rects.push([it[0], h-th-2, it[1], h]);
    });

    r_rects.reverse();

    l_rects=[];
    l_intervals.slice().reverse().forEach(it => {
        l_rects.push([it[0], 0, it[1], th]);
    });
    // Left
    intervals.forEach(it => {
        l_rects.push([0, it[0], th, it[1]]);
    });
    // Bottom
    l_intervals.forEach(it => {
        l_rects.push([it[0], h-th-2, it[1], h]);
    });

    l_rects.reverse();
    if (gaugePosR<barcnr) {topright(settings.gy);} else {topright(settings.fg);}
    if (gaugePosR<tarcnr) {bottomright(settings.gy);} else {bottomright(settings.fg);}

    if (gaugePosL<barcnr) {topleft(settings.gy);} else {topleft(settings.fg);}
    if (gaugePosL<tarcnr) {bottomleft(settings.gy);} else {bottomleft(settings.fg);}
    // fill rest of center
    g.setColor(g.theme.bg);
    g.fillRect(0+rad,0,     w-rad-2,h);
    g.fillRect(0    ,0+rad, w      ,h-rad-2);
    g.setColor(settings.fg);
    // Top
    r_rects.forEach((it,index) => {
        if (index >= gaugePosR) {g.setColor(settings.gy);}
        g.fillRect(it[0],it[1],it[2],it[3]);
    });

    g.setColor(settings.fg);
    l_rects.forEach((it,index) => {
        if (index >= gaugePosL) {g.setColor(settings.gy);}
        g.fillRect(it[0],it[1],it[2],it[3]);
    });
}


var cloudIcon = require("heatshrink").decompress(atob("kEggIfcj+AAYM/8ADBuFwAYPAmADCCAMBwEf8ADBhFwg4aBnEPAYMYjAVBhgDDDoQDHCYc4jwDB+EP///FYIDBMTgA=="));
var sunIcon = require("heatshrink").decompress(atob("kEggILIgOAAZkDAYPAgeBwPAgIFBBgPhw4TBp/yAYMcnADBnEcAYMwhgDBsEGgE/AYP8AYYLDCYgbDEYYrD8fHIwI7CIYZLDL54AHA=="));
var partSunIcon = require("heatshrink").decompress(atob("kEggIHEmADJjEwsEAjkw8EAh0B4EAg35wEAgP+CYMDwv8AYMDBAP2g8HgH+g0DBYMMgPwAYX8gOMEwMG3kAg8OvgSBjg2BgcYGQIcBAY5CBg0Av//HAM///4MYgNBEIMOCoUMDoUAnBwGkEA"));
var snowIcon = require("heatshrink").decompress(atob("kEggITQj/AAYM98ADBsEwAYPAjADCj+AgOAj/gAYMIuEHwEAjEPAYQVChk4AYQhCAYcYBYQTDnEPgEB+EH///IAQACE4IAB8EICIPghwDB4EeBYNAjgDBg8EAYQYCg4bCgZuFA=="));
var rainIcon = require("heatshrink").decompress(atob("kEggIPMh+AAYM/8ADBuFwAYPgmADB4EbAYOAj/ggOAhnwg4aBnAeCjEcCIMMjADCDoQDHjAPCnAXCuEP///8EDAYJECAAXBwkAgPDhwDBwUMgEEhkggEOjFgFgMQLYQAOA=="));
var errIcon = require("heatshrink").decompress(atob("kEggILIgOAAYsD4ADBg/gAYMGsADBhkwAYsYjADCjgDBmEMAYNxxwDBsOGAYPBwYDEgOBwOAgYDB4EDHYPAgwDBsADDhgDBFIcwjAHBjE4AYMcmADBhhNCKIcG/4AGOw4A=="));
var hrmImg = require("heatshrink").decompress(atob("i0WgIKHgPh8Ef5/g///44CBz///1///5A4PnBQk///wA4PBA4MDA4MH/+Ah/8gEP4EAjw0GA"));

// https://www.1001fonts.com/rounded-fonts.html?page=3
Graphics.prototype.setFontBloggerSansLight46 = function(scale) {
  // Actual height 46 (45 - 0)
  this.setFontCustom(atob("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAA/AAAAAAAAPwAAAAAAAD4AAAAAAAAeAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/AAAAAAAH/gAAAAAAP/wAAAAAAf/gAAAAAAf/AAAAAAA//AAAAAAB/+AAAAAAD/8AAAAAAH/4AAAAAAH/wAAAAAAP/gAAAAAAf/gAAAAAA//AAAAAAB/+AAAAAAA/8AAAAAAAP4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///8AAAAP////4AAAP/////AAAH/////4AAD+AAAB/AAA8AAAAHwAAeAAAAA+AAHgAAAAHgADwAAAAB4AA8AAAAAPAAPAAAAADwADwAAAAA8AA8AAAAAPAAPAAAAADwAB4AAAAB4AAeAAAAAeAAHwAAAAPgAA/AAAAPwAAH/////4AAA/////8AAAH////+AAAAf///+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAPAAAAAAAAHwAAAAAAAB4AAAAAAAA+AAAAAAAAfAAAAAAAAHgAAAAAAAD4AAAAAAAB8AAAAAAAAeAAAAAAAAPgAAAAAAADwAAAAAAAB//////4AAf//////AAH//////gAA//////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAD4AAHAAAAD+AAD4AAAB/gAA8AAAB/4AAfAAAA/+AAHgAAAf3gAB4AAAPx4AA8AAAH4eAAPAAAD4HgADwAAB8B4AA8AAA+AeAAPAAAfAHgADwAAPgB4AA8AAHwAeAAHgAD4AHgAB4AD8AB4AAfAB+AAeAAD8B/AAHgAAf//gAB4AAH//wAAeAAAf/wAAHgAAB/wAAA4AAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AADgAAAAPAAB4AAAADwAAeAAAAA+AAHgAAAAHgAB4ABgAB4AAeAA8AAeAAHgA/AADwAB4AfwAA8AAeAP8AAPAAHgH/AADwAB4H7wAA8AAeD48AAPAAHh8PAAHgAB5+BwAB4AAe/AeAA+AAH/AHwAfAAB/gA/AfgAAfwAH//wAAHwAA//4AAA4AAH/8AAAAAAAf4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAD+AAAAAAAD/gAAAAAAH/4AAAAAAH/+AAAAAAP/ngAAAAAP/h4AAAAAf/AeAAAAAf/AHgAAAA/+AB4AAAA/+AAeAAAB/8AAHgAAA/8AAB4AAAP4AAAeAAAB4AAAHgAAAAAAAB4AAAAAAAAeAAAAAAP///4AAAAH////AAAAA////gAAAAP///4AAAAAAB4AAAAAAAAeAAAAAAAAHgAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAD4AA8AAD///gAPAAB///4AD4AAf//+AAeAAH+APAAHgAB4AHgAA4AAeAB4AAOAAHgAcAADwAB4AHAAA8AAeADwAAPAAHgAcAADwAB4AHAAA8AAeAB4AAeAAHgAeAAHgAB4AHwAD4AAeAA+AB8AAHgAP4B+AAB4AB///gAAOAAP//gAABAAA//wAAAAAAD/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/gAAAAAB///4AAAAD////wAAAD////+AAAB/////4AAA/gPgB/AAAfgDwAHwAAPgA8AA+AADwAeAAHgAB4AHgAB4AAeAB4AAfAAHgAeAADwABwAHgAA8AAcAB4AAPAAHAAeAAHwAB4AHgAB4AAeAB8AAeAAHgAPAAPgAB4AD8APwAAOAAfwP4AADgAD//8AAAAAAf/+AAAAAAB/+AAAAAAAH8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAB4AAAAAAAAeAAAAAAAAHgAAAAAAAB4AAAAA4AAeAAAAB/AAHgAAAB/wAB4AAAB/4AAeAAAD/4AAHgAAD/wAAB4AAH/wAAAeAAH/gAAAHgAP/gAAAB4AP/AAAAAeAf/AAAAAHgf+AAAAAB4/+AAAAAAe/8AAAAAAH/8AAAAAAB/4AAAAAAAf4AAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/gAAAA/AB/+AAAA/8B//wAAA//gf/+AAAf/8PgPgAAH4fngB8AAD4B/wAPgAA8AP8AB4AAeAB+AAeAAHgAfgADwAB4ADwAA8AAcAA8AAPAAHAAPAADwAB4ADwAA8AAeAB+AAPAAHgAfgAHgAB8AP8AB4AAPgH/AA+AAD8H54AfAAAf/8fgPwAAD/+D//4AAAf/Af/8AAAB/AD/+AAAAAAAP+AAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHwAAAAAAAf/wAAAAAAf/+AAAAAAP//4AAwAAH//+AAeAAD+APwAHgAA+AA+AB4AAfAAHgAOAAHgAB4ADwAB4AAPAA8AAeAADwAPAAHgAA8ADwAB4AAPAA8AAeAADwAPAAHgAA8AHgAB8AAeAB4AAPgAHgA+AAD8ADwA/AAAfwA8A/gAAD/wef/wAAAf////4AAAB////4AAAAH///wAAAAAD/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AB4AAAAAfgA/AAAAAH4APwAAAAB+AD4AAAAAPAAeAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="), 46, atob("DRAcHBwcHBwcHBwcDQ=="), 56+(scale<<8)+(1<<16));
  return this;
};

Graphics.prototype.setFontRoboto20 = function(scale) {
  // Actual height 21 (20 - 0)
  this.setFontCustom(atob("AAAAAAAAAAAAAAAAAAAAAAAAH/zA/+YAAAAAAAHwAAwAAHwAA+AAAAAAAAAAAQACDAAYbADP4B/8A/zAGYZADH4A/+A/7AHYYADCAAAAAAAQAeHgH4eBzgwMMHnhw88GGBw4wHj+AcPgAAAAAAAAAAB4AA/gAGMAAwhwGMcAfuABzgABzgAc+AOMYBhBAAMYAB/AAHwAAAAAHwD5+A/8YGPDAw8YGPzA/HYD4fAADwAB/AAOYAABAAAAHwAA4AAAAAAAAAAH/gD//B8A+cAA7AADAAAAAAAYAAbwAHHgHwf/4A/8AAAAEAABiAAGwAA8AA/AAH+AAGwAByAAEAAAAAAAMAABgAAMAABgAH/wA/+AAMAABgAAMAABgAAAAAAAIAAfAADwAAAABgAAMAABgAAMAABgAAAAAAAAAAAAADAAAYAAAAAAAAADgAB8AB+AA+AA+AA/AAHAAAgAAAAAAB8AB/8Af/wHAHAwAYGADAwAYHAHAf/wB/8AAAAAAAAAAABgAAcAADAAAYAAH//A//4AAAAAAAAAAAAAAAAAAAAABwDAeA4HAPAwHYGBzAwcYHHDAfwYB8DAAAYAAAAAAABgOAcBwHADAwwYGGDAwwYHPHAf/wB58AAAAAAAAADAAB4AAfAAPYAHjAB4YA8DAH//A//4AAYAADAAAAAAAAAEMA/xwH+HAxgYGMDAxgYGODAw/4GD+AAHAAAAAAAAAf8AP/wD2HA5wYGMDAxgYGOHAA/wAD8AAAAAAAAAAAGAAAwAAGADAwB4GB+Aw+AGfAA/gAHwAAwAAAAAAADAB5+Af/wHPDAwwYGGDAwwYHPHAfvwB58AAAAAAAAAAAB+AAf4AHDjAwMYGBjAwM4HDOAf/gB/4AAAAAAAAAAAAYDADAYAAAAAAAAAAYDAfAYHwAAAABAAAcAADgAA+AAGwAB3AAMYABjgAYMAAAAAAAAAAAAAAABmAAMwABmAAMwABmAAMwABmAAMwAAiAAAAAAAAAYMADjgAMYAB3AAGwAA2AADgAAcAABAAAAAAAAAMAADgAA4AAGBzAweYGHAA/wAD8AAEAAAAwAB/4A/PwOAGDgAYYPxmH/Mw4ZmMDMxgZmM+Mx/5mHDAYAIDgDAPBwAf8AAMAAAAAAAYAAfAAPwAP4AH+AH4wA8GAH4wAP2AAPwAAfwAAfAAAYAAAAAAAAAAA//4H//AwwYGGDAwwYGGDAwwYH/HAf/wB58AAAAADAAH/AD/+AcBwHADAwAYGADAwAYGADA4A4DweAODgAAAAAAAAAAAAAAH//A//4GADAwAYGADAwAYGADAYAwD4+AP/gAfwAAAAAAAAAAAH//A//4GDDAwYYGDDAwYYGDDAwYYGCDAgAYAAAAAAAH//A//4GDAAwYAGDAAwYAGDAAwYAGAAAAAAAAAAH/AD/8AcBwHAHAwAYGADAwYYGDDA4YYDz/AOfwAAAAAAAAAAA//4H//A//4ADAAAYAADAAAYAADAAAYAADAA//4H//AAAAAAAAAAAAAAA//4H//AAAAAAAAABAAAeAAB4AADAAAYAADAAAYAAHA//wH/8AAAAAAAAAAAAAAA//4H//AAcAAPAAD4AA/wAOPADg8A4B4GAHAgAYAAAAAAAH//A//4AADAAAYAADAAAYAADAAAYAADAAAAAAAA//4H//A+AAB+AAD8AAD8AAH4AAPAAH4AH4AD8AD8AA+AAH//A//4AAAAAAAH//A//4H//AeAAB8AADwAAPgAAeAAA8AADwH//A//4AAAAAAAAAAAH/AB/8AeDwHAHAwAYGADAwAYGADA4A4DweAP/gA/4AAAAAAAAAAAH//A//4GBgAwMAGBgAwMAGBgAwcAH/AAfwAA8AAAAAA/4AP/gDgOA4A4GADAwAYGADAwAYHAHgeD+B/8wD+GAAAAAAAAAAA//4H//AwYAGDAAwYAGDgAweAHH8Afz4B8HAAAIAAYAPDwD8OA5w4GGDAwwYGHDAwYYHDnAePwBw8AAAAGAAAwAAGAAAwAAGAAA//4H//AwAAGAAAwAAGAAAwAAAAAAAAAH/4A//wAAPAAAYAADAAAYAADAAAYAAPA//wH/8AAAAAAAAgAAHAAA/AAB/AAD+AAD+AAD4AAfAAfwAfwAfwAH4AA4AAEAAA+AAH/AAH/gAD/AAD4AD+AH+AH8AA+AAH+AAD+AAD/AAD4AH/AP/AH+AA8AAAAAAAAAGADA4A4HweAPPgA/wAB8AAfwAPvgDweA8B4GADAAAIGAAA4AAHwAAPgAAfAAA/4AH/AD4AB8AA+AAHgAAwAAAAAAAAAGADAwB4GAfAwPYGDzAx4YGeDA/AYHwDA4AYGADAAAAAAAA///3//+wAA2AAGAAAGAAA+AAD8AAD8AAD4AAH4AAHgAAMAAAAwAA2AAG///3//+AAAAAAAAAAAOAAHwAD4AA8AAD8AADwAAGAAAAAAABgAAMAABgAAMAABgAAMAABgAAMAABgAAAEAAAwAADAAAIAAAAAAAAAAEeABn4Ad3ADMYAZjADMYAZmAB/4AP/AAAAAAAA//4H//ABgwAYDADAYAYDADg4AP+AA/gABwAAAAAAAAA/gAP+ADg4AYDADAYAYDADAYAOOABxwAAAAAEAAH8AB/wAcHADAYAYDADAYAcDA//4H//AAAAAAAAAAAAH8AB/wAdnADMYAZjADMYAZjAB84AHmAAMAAMAABgAB//gf/8HMAAxgAGIAAAAAAH8IB/zAcHMDAZgYDMDAZgcHcD//Af/wAAAAAAAAAAH//A//4AMAADAAAYAADAAAcAAD/4AP/AAAAAAAAAAAGf/Az/4AAAAAAAAAAMz//mf/4AAAAAAAAAAH//A//4ABwAAeAAH4ABzwAcPACAYAABAAAAAAAA//4H//AAAAAAAAAAAAf/AD/4AMAADAAAYAADAAAcAAD/4AP/ABgAAYAADAAAYAADgAAP/AA/4AAAAAAAAf/AD/4AMAADAAAYAADAAAcAAD/4AP/AAAAAAAAAAAAH8AB/wAcHADAYAYDADAYAYDADx4AP+AA/gAAAAAAAAf/8D//gYDADAYAYDADAYAcHAB/wAH8AAEAAAAAAEAAH8AB/wAcHADAYAYDADAYAYDAD//gf/8AAAAAAAAAAAf/AD/4AcAADAAAYAACAAAAEAB5wAfnADMYAZjADGYAYzADn4AOeAAAAAAAADAAAYAAf/wD//ADAYAYDAAAAAAAAD/gAf/AAA4AADAAAYAADAAAwAf/AD/4AAAAAAAAYAAD4AAP4AAP4AAPAAH4AH4AD8AAcAAAAAAQAADwAAf4AAf4AAPAAP4AP4ADwAAfgAA/gAA/AAD4AH+AD+AAeAAAAAAAAACAYAcHADzwAH8AAfAAH8ADx4AcHACAIAcAMD4BgP4MAP/AAPwAP4AP4AD4AAcAAAAAAAAADAYAYHADD4AY7ADOYAfjADwYAcDADAYAAAAADAAA4AH//B/v8cABzAACAAAH//w//+AAAAAAACAACcAAx/n+H//AA4AAHAAAAAAAAAAAAAOAADgAAYAADAAAcAABgAAGAAAwAAGAADwAAcAAAAA"), 32, atob("BQUHDQwPDQQHBwkMBAYGCQwMDAwMDAwMDAwFBAsMCwoTDg0ODgwMDg8GDA0LEg8ODQ4NDA0ODRMNDQ0GCQYJCQYLDAsMCwcMDAUFCwUSDAwMDAcLBwwKEAoKCgcFBw4A"), 21+(scale<<8)+(1<<16));
  return this;
};

function setSmallFont20() {
  g.setFontRoboto20();
}

function setLargeFont() {
  g.setFontBloggerSansLight46(1);
}

function setSmallFont() {
  g.setFont('Vector', 16);
}

function setVerySmallFont() {
  g.setFont('Vector', 12);
}

function getSteps() {
  try {
    return Bangle.getHealthStatus("day").steps;
  } catch (e) {
    if (WIDGETS.wpedom !== undefined) 
      return WIDGETS.wpedom.getSteps();
    else
      return 0;
  }
}

/////////////// sunrise / sunset /////////////////////////////

function loadSettings() {
  settings = require("Storage").readJSON(SETTINGS_FILE,1)||{};
  settings.gy = settings.gy||'#020';
  settings.fg = settings.fg||'#0f0';
  settings.idle_check = settings.idle_check||true;
}

// requires the myLocation app
function loadLocation() {
  location = require("Storage").readJSON(LOCATION_FILE,1)||{};
  location.lat = location.lat||51.5072;
  location.lon = location.lon||0.1276;
  location.location = location.location||"London";
}

function extractTime(d){
  var h = d.getHours(), m = d.getMinutes();
  return(("0"+h).substr(-2) + ":" + ("0"+m).substr(-2));
}

var sunRise = "00:00";
var sunSet = "00:00";
var drawCount = 0;

function updateSunRiseSunSet(now, lat, lon, line){
  // get today's sunlight times for lat/lon
  var times = SunCalc.getTimes(new Date(), lat, lon);

  // format sunrise time from the Date object
  sunRise = extractTime(times.sunrise);
  sunSet = extractTime(times.sunset);
}

const infoData = {
  ID_DATE:  { calc: () => {var d = (new Date()).toString().split(" "); return d[2] + ' ' + d[1] + ' ' + d[3];} },
  ID_DAY:   { calc: () => {var d = require("locale").dow(new Date()).toLowerCase(); return d[0].toUpperCase() + d.substring(1);} },
  ID_SR:    { calc: () => 'SUNRISE ' + sunRise },
  ID_SS:    { calc: () => 'SUNSET ' + sunSet },
  ID_STEP:  { calc: () => 'STEPS ' + getSteps() },
  ID_BATT:  { calc: () => 'BATTERY ' + E.getBattery() + '%' },
  ID_HRM:   { calc: () => hrmCurrent }
};

const infoList = Object.keys(infoData).sort();
let infoMode = infoList[0];

function nextInfo() {
  let idx = infoList.indexOf(infoMode);
  if (idx > -1) {
    if (idx === infoList.length - 1) infoMode = infoList[0];
    else infoMode = infoList[idx + 1];
  }
  // power HRM on/off accordingly
  Bangle.setHRMPower(infoMode == "ID_HRM" ? 1 : 0);
  resetHrm();
}

function prevInfo() {
  let idx = infoList.indexOf(infoMode);
  if (idx > -1) {
    if (idx === 0) infoMode = infoList[infoList.length - 1];
    else infoMode = infoList[idx - 1];
  }
  // power HRM on/off accordingly
  Bangle.setHRMPower(infoMode == "ID_HRM" ? 1 : 0);
  resetHrm();
}

function clearInfo() {
  g.setColor(g.theme.bg);
  //g.setColor(g.theme.fg);
  g.fillRect((w/2) - infoWidth, infoLine - infoHeight, (w/2) + infoWidth, infoLine + infoHeight); 
}

function drawInfo() {
  clearInfo();
  g.setColor(g.theme.fg);
  setSmallFont();
  g.setFontAlign(0,0);

  if (infoMode == "ID_HRM") {
    clearInfo();
    g.setColor('#f00'); // red
    drawHeartIcon();
  } else {
    g.drawString((infoData[infoMode].calc().toUpperCase()), w/2, infoLine);
  }
}

function drawHeartIcon() {
  g.drawImage(hrmImg, (w/2) - infoHeight - 20, infoLine - infoHeight);
}

function drawHrm() {
  if (idle) return; // dont draw while prompting
  var d = new Date();
  clearInfo();
  g.setColor(d.getSeconds()&1 ? '#f00' : g.theme.bg);
  drawHeartIcon();
  setSmallFont();
  g.setFontAlign(-1,0); // left
  g.setColor(hrmConfidence >= 50 ? g.theme.fg : '#f00');
  g.drawString(hrmCurrent, (w/2) + 10, infoLine);
}

function draw() {
  if (!idle)
    drawClock();
  else
    drawIdle();
  queueDraw();
}

/**
Choose weather icon to display based on condition.
Based on function from the Bangle weather app so it should handle all of the conditions
sent from gadget bridge.
*/
function chooseIcon(condition) {
  condition = condition.toLowerCase();
  if (condition.includes("thunderstorm")) return stormIcon;
  if (condition.includes("freezing")||condition.includes("snow")||
    condition.includes("sleet")) {
    return snowIcon;
  }
  if (condition.includes("drizzle")||
    condition.includes("shower")) {
    return rainIcon;
  }
  if (condition.includes("rain")) return rainIcon;
  if (condition.includes("clear")) return sunIcon;
  if (condition.includes("few clouds")) return partSunIcon;
  if (condition.includes("scattered clouds")) return cloudIcon;
  if (condition.includes("clouds")) return cloudIcon;
  if (condition.includes("mist") ||
    condition.includes("smoke") ||
    condition.includes("haze") ||
    condition.includes("sand") ||
    condition.includes("dust") ||
    condition.includes("fog") ||
    condition.includes("ash") ||
    condition.includes("squalls") ||
    condition.includes("tornado")) {
    return cloudIcon;
  }
  return cloudIcon;
}

function getTideIcon(ishigh){
    if (ishigh){
        return require("heatshrink").decompress(atob("j0ewIPMgPggEMg+AgEwv4DB4P+gEDj4DBhl//EAmP/CwPD/4OBh/8mEP///4E/z18gHAFYMDh0cB0UPBwQAO"));
    } else {
        return require("heatshrink").decompress(atob("j0ewISPhgDCmADC4ACBgYOOgPgBwMHwAOBv4DB4P+BwMfAYMMv/4gEx/4WB4f/BwMP/kwh////An+evgsEh0cBwkPBwQAOA="));
    }
}

/**
Get weather stored in json file by weather app.
*/
function getWeather() {
  let jsonWeather = storage.readJSON('weather.json');
  return jsonWeather;
}

function drawClock() {
  var date = new Date();
  var timeStr = require("locale").time(date,1);
  var da = date.toString().split(" ");
  var time = da[4].substr(0,5);
  var hh = da[4].substr(0,2);
  var mm = da[4].substr(3,2);
  var steps = getSteps();
  var p_steps = Math.round(100*(steps/10000));

  var weatherJson = getWeather();
  var w_temp;
  var w_icon;
  var w_wind;
  var x = (g.getWidth()/2);
  var y = (g.getHeight()/3);
  //if (settings.weather && weatherJson && weatherJson.weather) {
  if (true && weatherJson && weatherJson.weather) {
      var currentWeather = weatherJson.weather;
      const temp = locale.temp(currentWeather.temp-273.15,0).match(/^(\D*\d*)(.*)$/);
      w_temp = temp[1] + " " + temp[2];
      w_icon = chooseIcon(currentWeather.txt);
      //const wind = locale.speed(currentWeather.wind).match(/^(\D*\d*)(.*)$/);
      // const wind = ''+Math.round(currentWeather.wind*5/18.0)+" m/s";
      // w_wind = wind[1] + " " + wind[2] + " " + (currentWeather.wrose||'').toUpperCase();
      w_wind = ''+Math.round(currentWeather.wind*5/18.0)+" m/s";
  } else {
      w_temp = "Err";
      w_wind = "???";
      w_icon = errIcon;
  }
    if (showtides){
        let th = ieclock.tides.height;
        tide.dec1=th.toFixed(0);
        tide.dec2=((Math.abs(th)%1)*10).toFixed();
        tide.icon = getTideIcon(ieclock.tides.high);
        tide.timestring = timeCompact.compactTime(ieclock.tides.time);

        tmph = getTideHeight(date.getTime);
        cntr = (ieclock.tides.high + ieclock.tides.lasthigh)/2;
        rng =  Math.abs(ieclock.tides.high - ieclock.tides.lasthigh);
        tide.hscaled = 100*((tmph - cntr)/rng + 0.5);
    }
  
  g.reset();
  g.setColor(g.theme.bg);
  g.fillRect(0, 0, w, h);
  drawGauge(tide.hscaled, p_steps);
  setLargeFont();

  g.setColor(settings.fg);
  g.setFontAlign(1,0);  // right aligned
  g.drawString(hh, (w/2) - 1, h/2);

  g.setColor(g.theme.fg);
  g.setFontAlign(-1,0); // left aligned
  g.drawString(mm, (w/2) + 1, h/2);

    if (true) {
        if (drawCount%3<2){
            g.drawImage(w_icon, (w/2) - 40, 24);
            setSmallFont();
            g.setFontAlign(-1,0); // left aligned
            if (drawCount % 2 == 0)
                g.drawString(w_temp, (w/2) + 6, 24 + ((y - 24)/2));
            else
                g.drawString( (w_wind.split(' ').slice(0, 2).join(' ')), (w/2) + 6, 24 + ((y - 24)/2));
            // display first 2 words of the wind string eg '4 mph'
        } else {
            g.drawImage(tide.icon, w/2-40,24);
            setSmallFont();
            g.setFontAlign(-1,0);
            g.drawString(tide.dec1, w/2 - 5, 24+((y-24)/2));
            setVerySmallFont();
            g.setFontAlign(-1,-1);
            g.drawString(tide.dec2,x+3, 24+((y-24)/2));
            setSmallFont();
            g.setFontAlign(-1,0);
            g.drawString('m|', x+11, 24+((y-24)/2));
            g.drawString(tide.timestring, x+30, 24+((y-24)/2));
        }
    }
  drawInfo();
  
  // recalc sunrise / sunset every hour
  if (drawCount % 60 == 0)
    updateSunRiseSunSet(new Date(), location.lat, location.lon);
  drawCount++;
}

function drawSteps() {
  if (drawingSteps) return;
  drawingSteps = true;
  clearInfo();
  setSmallFont();
  g.setFontAlign(0,0);
  g.setColor(g.theme.fg);
  g.drawString('STEPS ' + getSteps(), w/2, (3*h/4) - 4);
  drawingSteps = false;
}

/////////////////   GAUGE images /////////////////////////////////////

var hrmCurrent = "--";
var hrmConfidence = 0;

function resetHrm() {
  hrmCurrent = "--";
  hrmConfidence = 0;
  if (infoMode == "ID_HRM") {
    clearInfo();
    g.setColor('#f00'); // red
    drawHeartIcon();
  }
}

Bangle.on('HRM', function(hrm) {
  hrmCurrent = hrm.bpm;
  hrmConfidence = hrm.confidence;
  log_debug("HRM=" + hrm.bpm + " (" + hrm.confidence + ")"); 
  if (infoMode == "ID_HRM" ) drawHrm();
});


/////////////////   IDLE TIMER /////////////////////////////////////

function drawIdle() {
  let mins = Math.round((getTime() - lastStep) / 60);
  g.reset();
  g.setColor(g.theme.bg);
  g.fillRect(Bangle.appRect);
  g.setColor(g.theme.fg);
  setSmallFont20();
  g.setFontAlign(0, 0);
  g.drawString('Last step was', w/2, (h/3));
  g.drawString(mins + ' minutes ago', w/2, 20+(h/3));
  dismissBtn.draw();
}

///////////////   BUTTON CLASS ///////////////////////////////////////////

// simple on screen button class
function BUTTON(name,x,y,w,h,c,f,tx) {
  this.name = name;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.color = c;
  this.callback = f;
  this.text = tx;
}

// if pressed the callback
BUTTON.prototype.check = function(x,y) {
  //console.log(this.name + ":check() x=" + x + " y=" + y +"\n");
  
  if (x>= this.x && x<= (this.x + this.w) && y>= this.y && y<= (this.y + this.h)) {
    log_debug(this.name + ":callback\n");
    this.callback();
    return true;
  }
  return false;
};

BUTTON.prototype.draw = function() {
  g.setColor(this.color);
  g.fillRect(this.x, this.y, this.x + this.w, this.y + this.h);
  g.setColor("#000"); // the icons and boxes are drawn black
  setSmallFont20();
  g.setFontAlign(0, 0);
  g.drawString(this.text, (this.x + this.w/2), (this.y + this.h/2));
  g.drawRect(this.x, this.y, (this.x + this.w), (this.y + this.h));
};

function dismissPrompt() {
  idle = false;
  warned = false;
  lastStep = getTime();
  Bangle.buzz(100);
  draw();
}

var dismissBtn = new BUTTON("big",0, 3*h/4 ,w, h/4, "#0ff", dismissPrompt, "Dismiss");

Bangle.on('touch', function(button, xy) {
  var x = xy.x;
  var y = xy.y;
  // adjust for outside the dimension of the screen
  // http://forum.espruino.com/conversations/371867/#comment16406025
  if (y > h) y = h;
  if (y < 0) y = 0;
  if (x > w) x = w;
  if (x < 0) x = 0;

  if (idle && dismissBtn.check(x, y)) return;
});

// if we get a step then we are not idle
Bangle.on('step', s => {
  lastStep = getTime();
  // redraw if we had been idle
  if (idle == true) {
    dismissPrompt();
  }
  idle = false;
  warned = 0;

  if (infoMode == "ID_STEP") drawSteps();
});

function checkIdle() {
  log_debug("checkIdle()");
  if (!settings.idle_check) {
    idle = false;
    warned = false;
    return;
  }
  
  let hour = (new Date()).getHours();
  let active = (hour >= 9 && hour < 21);
  //let active = true;
  let dur = getTime() - lastStep;

  if (active && dur > IDLE_MINUTES * 60) {
    drawIdle();
    if (warned++ < 3) {
      buzzer(warned);
      log_debug("checkIdle: warned=" + warned);
      Bangle.setLocked(false);
    }
    idle = true;
  } else {
    idle = false;
    warned = 0;
  }
}

// timeout for multi-buzzer
var buzzTimeout;

// n buzzes
function buzzer(n) {
  log_debug("buzzer n=" + n);

  if (n-- < 1) return;
  Bangle.buzz(250);
  
  if (buzzTimeout) clearTimeout(buzzTimeout);
  buzzTimeout = setTimeout(function() {
    buzzTimeout = undefined;
    buzzer(n);
  }, 500);
}

///////////////////////////////////////////////////////////////////////////////

// timeout used to update every minute
var drawTimeout;

// schedule a draw for the next minute
function queueDraw() {
  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = setTimeout(function() {
    drawTimeout = undefined;
    checkIdle();
    draw();
  }, 60000 - (Date.now() % 60000));
}

// Stop updates when LCD is off, restart when on
Bangle.on('lcdPower',on=>{
  if (on) {
    draw(); // draw immediately, queue redraw
  } else { // stop draw timer
    if (drawTimeout) clearTimeout(drawTimeout);
    drawTimeout = undefined;
  }
});

Bangle.setUI("clockupdown", btn=> {
  if (btn<0) prevInfo();
  if (btn>0) nextInfo();
  draw();
});

loadSettings();
loadLocation();

g.clear();
Bangle.loadWidgets();
/*
 * we are not drawing the widgets as we are taking over the whole screen
 * so we will blank out the draw() functions of each widget and change the
 * area to the top bar doesn't get cleared.
 */
for (let wd of WIDGETS) {wd.draw=()=>{};wd.area="";}
draw();