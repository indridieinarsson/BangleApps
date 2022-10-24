var SunCalc = require("https://raw.githubusercontent.com/mourner/suncalc/master/suncalc.js");
const storage = require('Storage');
const locale = require("locale");
const SETTINGS_FILE = "dualgauge.json";
const LOCATION_FILE = "mylocation.json";
const h = g.getHeight();
const w = g.getWidth();
const rad = 20;
const th = 5;
const bl = Math.round(0.5*Math.PI*rad);
const halflength = (w/2-rad) + bl + (h-rad-rad) + bl + (w/2-rad);
const n_hbl = Math.round((w/2-rad)/bl);
const n_bl = Math.round((w-2*rad)/bl);
const showtides = true;

var settings;
var location;

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
var cg_topright, cg_bottomright,vg_r,hg_rl,hg_ru,cg_topleft,cg_bottomleft,vg_l,hg_ll,hg_lu;
var halfGaugeLength;

clearAppArea=function(){
  g.fillRect(0,0,w,h);
};
clearClockArea=function(){
  g.setColor(g.theme.bg);
  g.fillRect(0+rad,0+th+2, w-rad, h-th-3);
  g.fillRect(0+th+2,0+rad, w-th-3, h-rad);
};

var timeCompact={};
timeCompact.quarters = [0, String.fromCharCode(188), String.fromCharCode(189), String.fromCharCode(190), 0];
timeCompact.compactTime = function(t) {
    return ''+t.getHours()+this.quarters[Math.round(t.getMinutes()/15)];
};

function log_debug(o) {
  // print(o);
}

function getTideHeight(nowt){
  dt=ieclock.tides.timestamp-ieclock.tides.timelast;
  nowscale = (nowt-ieclock.tides.timelast)*Math.PI/dt;
  c = -ieclock.tides.high*Math.cos(nowscale);
  if (!ieclock.tides.high)
    c=-c;
  rng = (ieclock.tides.height-ieclock.tides.lastheight)/2;
  return rng+ieclock.tides.lastheight + c*rng;
}

// Circular gauge
var p; // temp for prototype references
function CGauge(id,val,minV,maxV,color,fColor,begDeg,degs,deg0
               ,x,y,rOuter,rInner,fill,fFill,bgColor) {
  var _=0||this;
  _.mxXY=239;     // x, y max graph coord - defaults for BangleJS Graphics
  _.pps=2;        // 'pixel per segment'/jaggedness/graphical precision/resolution
  _.tikL=6;       // tick-length (set to 0 post construction for no ticks drawing)
  _.dado=1;       // draw arc delta only
  _.bClr=[0,0,0]; // background color (used as default)
  _.id=id;        // id of the circular gauge
  _.val=null;     // temporary, set at end of construction
  _.minV=minV;    // minimum value (arc all in fColor)
  _.maxV=maxV;    // maximum value (arc all in color)
  _.clr=color;    // color - as required by Graphics - for the value arc
  _.fClr=fColor;  // color - as required by Graphics - for to complete the arc
  _.begD=begDeg;  // 0 degrees: +x-Axis
  _.degs=degs;    // gauge full arc in degrees -/+ = counter/clockwise
  _.deg0=(deg0==null)?deg0:begDeg; // for 0/center value mark; null defaults to begDeg
  _.x=x;          // center x
  _.y=y;          // center y
  _.rOut=rOuter;  // radius outer
  _.rIn=rInner;   // radius inner (optional)
  _.fV=fill;      // fill value arc w/ color
  _.fF=fFill;     // fill filler arc w/ fColor
  _.bClr=(bgColor)?bgColor:this.bClr;                // opt bg color, defaults blk 
  _.begR=_.rad(_.begD);                              // begin radian
  _.arcR=(_.degs==360)?Math.PI*2:_.rad(_.degs);      // arc rad used for sCnt only
  _.segR=(Math.PI/(4/_.pps)/_.rOut)*((degs>0)?1:-1); // segment radian
  _.sCnt=Math.round(Math.abs(_.arcR/_.segR));        // segment count in arc
  _.cUp=[];                                          // clean up vertices 
  _.vLD=null;       // (display/draw) value (v) last displayed/drawn
  _.setVal(val,-1); // set value only
} p=CGauge.prototype;
p.setVal=function(v,o1,o2) { // --- set min/max adj'd val, draw != && o1=0 || o1>0; 
    // var chd = (v=(v<this.minV)?this.minV:(v>this.maxV)?this.maxV:v)!=this.val; // ret
    v=(v<this.minV)?this.minV:(v>this.maxV)?this.maxV:v; // ret
    if (o1<0) {
        this.val=v; this.vLD=null; // update value only, NO drawing & never draw 
    } else {
        this.val = v;
        this.draw(1);
    }
    // if (o1<0) { this.val=v; this.vLD=null; // update value only, NO drawing & never draw
  // } else if (v!=this.val||o1>0||o2) { this.val=v; this.draw(o1,o2); }
  // return chd; };
};
p.draw=function(o1,o2) { // --- draw circular gauge (otp1:value, 2:ticks+extras)
  g.reset();
  let s=this.sCnt,v=Math.round(s/(this.maxV-this.minV)*(this.val-this.minV))
    , h=(this.rIn)?1:0,fV=!!this.fV,fF=!!this.fF,bC=this.bClr
    , vL,vs,m; 
  if (o1!=-1) { if (h&&(fV==fF)) { g.setColor.apply(g,bC);
         while (this.cUp.length) {g.drawLine.apply(g,this.cUp.pop()); }
      } else { this.cUp=[]; }
    if (o1==1||!this.dado||(vL=this.vLD)==null) {
      if (v<s) { vs=this._pvs(v,s,-1,0);
        if (h&&!fF&&fV) { g.setColor.apply(g,bC); this.fSs(vs,vs.length); }
        g.setColor.apply(g,this.fClr).drawPoly(vs,h);
        if (h&&fF) this.fSs(vs,vs.length); vs=null; }
      vs=this._pvs(0,v,1,1);
      if (h&&!fV&&fF) { g.setColor.apply(g,bC); this.fSs(vs,vs.length); }
      g.setColor.apply(g,this.clr).drawPoly(vs,h);
      if (h&&fV) this.fSs(vs,vs.length); vs=null;
    } else if (v>vL) { vs=this._pvs(vL,v,1,1);
      if (h&&!fV&&fF) { g.setColor.apply(g,bC); this.fSs(vs,vs.length); }
      g.setColor.apply(g,this.clr).drawPoly(vs,h&&vL==0);
      if (h&&fV) this.fSs(vs,vs.length); vs=null;
    } else if (v<vL) { vs=this._pvs(v,vL,-1,1);
      if (h&&!fF&&fV) { g.setColor.apply(g,bC); this.fSs(vs,vs.length); }
      g.setColor.apply(g,this.fClr).drawPoly(vs,h&&vL==s);
      if (h&&fF) this.fSs(vs,vs.length);
      vs=(h)?vs.slice((m=vs.length/2-2),m+4):(m=vs.slice(-2)).concat(m);
      g.setColor.apply(g,this.clr);//g.drawLine.apply(g,vs);
  } } this.vLD=v; };
p.fSs=function(vs,vsL) { // --- fill
  if (vsL<64) { g.fillPoly(vs,1); 
  } else { let k=30,l=vsL/2,i=0,j=vsL-k,n; 
    while (i<l) { 
      g.fillPoly(vs.slice(i,i+=k).concat(vs.slice(j,j+k)),1);
      if (i<l) { i-=2; if ((n=l-i)<30) k=n; j-=k-2;
        if (k==2) { k+=2; i-=2; j+=2; }
  } } } };
p._pvs=function(f,t,d,c) { // --- calc polygon vertices from..to in direction
  let x=this.x, y=this.y, rO=this.rOut, rI=this.rIn, bR=this.begR, sR=this.segR
    , l=(t-f+1)*2*((rI)?2:1) // len of array for vertices (double w/ inner radius
    , v=((this.mxXY<=355) ? new Uint8Array(l) : new Uint16Array(l)) // vertices array
    , s=f-1  // segment index 
    , i=-1,j // vertices array index (running and 'turn around'/last outer)
    , m=(d>0)?f:t,r // segmentRadian 'multiplier' (starting w/ f or t+1), radian
    ; 
  while (++s<=t) { r=bR+m*sR; m+=d;
    v[++i]=Math.round(x+rO*Math.cos(r));
    v[++i]=Math.round(y+rO*Math.sin(r)); } 
  if (rI) { j=i;
    while (--s>=f) { m-=d; r=bR+m*sR;
      v[++i]=Math.round(x+rI*Math.cos(r));
      v[++i]=Math.round(y+rI*Math.sin(r)); }
    if (c) this.cUp.push(v.slice(j-1,j+3));
  } 
  return v; };
p.rad=function(degrs) { return 2*Math.PI*(degrs%360)/360; }; // radian <-- degrees



// -----------

// Horizontal and vertical gauges
var q; // temp for prototype references
function HGauge(id, val,minV,maxV,color,fColor
               ,x1,y1,x2,y2) {
  //var _=0||this;
  var _ = this;
  _.id=id;        // id of the circular gauge
  _.val=null;     // temporary, set at end of construction
  _.minV=minV;    // minimum value (arc all in fColor)
  _.maxV=maxV;    // maximum value (arc all in color)
  _.clr=color;    // color - as required by Graphics - for the value arc
  _.fClr=fColor;  // color - as required by Graphics - for to complete the arc
  _.begX=x1;//begX;  // 0 degrees: +x-Axis
  _.x1=x1;          // center x
  _.y1=y1;          // center y
  _.x2=x2;          // center x
  _.y2=y2;          // center y
  _.xrange=x2-x1;
  _.vLD=null;       // (display/draw) value (v) last displayed/drawn
  _.setVal(val,-1); // set value only
} q=HGauge.prototype;
q.setVal=function(v,o1,o2) { // --- set min/max adj'd val, draw != && o1=0 || o1>0; 
  // var chd = (v=(v<this.minV)?this.minV:(v>this.maxV)?this.maxV:v)!=this.val; // ret
  v=(v<this.minV)?this.minV:(v>this.maxV)?this.maxV:v; // ret
  this.val=v;
  this.draw();
  // if (o1<0) { this.val=v; this.vLD=null; // update value only, NO drawing & never draw
  // } else if (v!=this.val||o1>0||o2) { this.val=v; this.draw(o1,o2); }
  // return chd; };
};
q.draw=function(o1,o2) {
  g.reset();
  xi = (this.val-this.minV)*this.xrange/(this.maxV-this.minV) + this.begX;
  g.setColor.apply(g,this.clr);
  g.fillRect(this.x1,this.y1, xi,this.y2);
  if (xi==this.x2) {return;}
  g.setColor.apply(g,this.fClr);
  g.fillRect(xi,this.y1,this.x2,this.y2);
  };

// -----------------
var s; // temp for prototype references
function VGauge(id, val,minV,maxV,color,fColor
               ,x1,y1,x2,y2) {
  //var _=0||this;
  var _ = this;
  _.id=id;        // id of the circular gauge
  _.val=null;     // temporary, set at end of construction
  _.minV=minV;    // minimum value (arc all in fColor)
  _.maxV=maxV;    // maximum value (arc all in color)
  _.clr=color;    // color - as required by Graphics - for the value arc
  _.fClr=fColor;  // color - as required by Graphics - for to complete the arc
  _.begY=y1;      // 0 degrees: +x-Axis
  _.x1=x1;          // center x
  _.y1=y1;          // center y
  _.x2=x2;          // center x
  _.y2=y2;          // center y
  _.yrange=y2-y1;
  _.vLD=null;       // (display/draw) value (v) last displayed/drawn
  _.setVal(val,-1); // set value only
} s=VGauge.prototype;
s.setVal=function(v,o1,o2) { // --- set min/max adj'd val, draw != && o1=0 || o1>0; 
  // var chd = (v=(v<this.minV)?this.minV:(v>this.maxV)?this.maxV:v)!=this.val; // ret
  v=(v<this.minV)?this.minV:(v>this.maxV)?this.maxV:v; // ret
  this.val=v;  
  this.draw();
  // if (o1<0) { this.val=v; this.vLD=null; // update value only, NO drawing & never draw
  // } else if (v!=this.val||o1>0||o2) { this.val=v; this.draw(o1,o2); }
  // return chd; };
};
s.draw=function(o1,o2) {
  g.reset();
  yi = (this.val-this.minV)*this.yrange/(this.maxV-this.minV) + this.begY;
  g.setColor.apply(g,this.clr);
  g.fillRect(this.x1,this.y1, this.x2, yi);
  if (yi==this.y2) {return;}
  g.setColor.apply(g,this.fClr);
  g.fillRect(this.x1, yi, this.x2,this.y2);
  };
//-----------


setupGauge=function(){
    let halfl=w/2-rad-1;
    let cornerl = Math.PI*rad/2;
    let fulll = h-2*rad-1;
    let tmp=0;
    hg_rl = new HGauge("hg_rl", tmp,tmp,tmp+=halfl,settings.fg, settings.gy, w/2,h-th-2, w-rad-1,h);
    cg_bottomright=new CGauge("bottomright",tmp+1, tmp+1, tmp+=cornerl, settings.fg, settings.gy, 90, -90,null, w-rad-1,h-rad-1, rad,rad-th-1, settings.fg, settings.gy, [0,0,0]);
    vg_r = new VGauge("vg_r", tmp+1, tmp+1, tmp+=fulll, settings.fg, settings.gy, w, h-rad-1,  w-th-2, rad);
    cg_topright=new CGauge("topright",tmp+1, tmp+1, tmp+=cornerl, settings.fg, settings.gy, 0, -90,null, w-rad-1,0+rad, rad,rad-th-1, settings.fg, settings.gy, [0,0,0]);
    hg_ru = new HGauge("hg_ru", tmp+1,tmp+1,tmp+=halfl,settings.fg, settings.gy, w-rad-1,th+1, w/2,0);

    tmp=0;
    hg_ll = new HGauge("hg_ll", tmp,tmp,tmp+=halfl,settings.fg, settings.gy, w/2,h-th-2, rad,h);
    cg_bottomleft=new CGauge("bottomleft",tmp+1, tmp+1, tmp+=cornerl, settings.fg, settings.gy, 90, 90,null, 0+rad  ,h-rad-1, rad,rad-th-1, settings.fg, settings.gy, [0,0,0]);
    vg_l = new VGauge("vg_l", tmp+1, tmp+1, tmp+=fulll, settings.fg, settings.gy, th+1, h-rad-1, 0, rad);
    cg_topleft=new CGauge("topleft",tmp+1, tmp+1, tmp+=cornerl, settings.fg, settings.gy, 180, 90,null, 0+rad,0+rad, rad,rad-th-1, settings.fg, settings.gy, [0,0,0]);
    hg_lu = new HGauge("hg_lu", tmp+1,tmp+1,tmp+=halfl,settings.fg, settings.gy, rad,th+1, w/2,0);
    halfGaugeLength=tmp;

    setvals_l(1000);setvals_l(0);
    setvals_r(1000);setvals_r(0);
};

setvals_r = function(x) {
  cg_topright.setVal(x);
  cg_bottomright.setVal(x);
  vg_r.setVal(x);
  hg_rl.setVal(x);
  hg_ru.setVal(x);
};
setvals_l = function(x) {
  cg_topleft.setVal(x);
  cg_bottomleft.setVal(x);
  vg_l.setVal(x);
  hg_ll.setVal(x);
  hg_lu.setVal(x);
};

function drawGauge(percL, percR){
    setvals_l(percL*halfGaugeLength/100);
    setvals_r(percR*halfGaugeLength/100);
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
    settings.gy = settings.gy||[0,0.125,0];
    settings.fg = settings.fg||[0,1,0];
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
  let h = d.getHours(), m = d.getMinutes();
  return(("0"+h).substr(-2) + ":" + ("0"+m).substr(-2));
}

var sunRise = "00:00";
var sunSet = "00:00";
var drawCount = 0;

function updateSunRiseSunSet(now, lat, lon, line){
  // get today's sunlight times for lat/lon
  let times = SunCalc.getTimes(new Date(), lat, lon);
  // format sunrise time from the Date object
  sunRise = extractTime(times.sunrise);
  sunSet = extractTime(times.sunset);
}

const infoData = {
  ID_DATE:  { calc: () => {let d = (new Date()).toString().split(" "); return d[2] + ' ' + d[1] + ' ' + d[3];} },
  ID_DAY:   { calc: () => {let d = require("locale").dow(new Date()).toLowerCase(); return d[0].toUpperCase() + d.substring(1);} },
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
  let d = new Date();
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
    drawClock(true);
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

function gaugeAndReset(hscaled, pst){
  g.reset();
  g.setColor(g.theme.bg);
  clearAppArea();
  drawGauge(hscaled, pst);
}

function drawClock(doGauge) {
  let date = new Date();
  let timeStr = require("locale").time(date,1);
  let da = date.toString().split(" ");
  let time = da[4].substr(0,5);
  let hh = da[4].substr(0,2);
  let mm = da[4].substr(3,2);
  let steps = getSteps();
  let p_steps = Math.round(100*(steps/10000));

  let weatherJson = getWeather();
  let w_temp;
  let w_icon;
  let w_wind;
  let x = (g.getWidth()/2);
  let y = (g.getHeight()/3);
  
  //if (settings.weather && weatherJson && weatherJson.weather) {
  if (true && weatherJson && weatherJson.weather) {
      let currentWeather = weatherJson.weather;
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

        let tmph = getTideHeight(date.getTime());
        let cntr = (ieclock.tides.height + ieclock.tides.lastheight)/2;
        let rng =  Math.abs(ieclock.tides.height - ieclock.tides.lastheight);
        tide.hscaled = 100*((tmph - cntr)/rng + 0.5);
    }
  g.setColor(g.theme.bg);
  if (doGauge){
    gaugeAndReset(tide.hscaled, p_steps);
  } else {
    clearClockArea();
  }
  setLargeFont();

  g.setColor.apply(g,settings.fg);
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
  // g.fillRect(Bangle.appRect);
  clearAppArea();
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
  log_debug("clockupdown btn press " + btn);
  if (btn<0) prevInfo();
  if (btn>0) nextInfo();
  drawClock(false);
  queueDraw();
});

loadSettings();
loadLocation();

g.clear();
setupGauge();
Bangle.loadWidgets();
/*
 * we are not drawing the widgets as we are taking over the whole screen
 * so we will blank out the draw() functions of each widget and change the
 * area to the top bar doesn't get cleared.
 */
for (let wd of WIDGETS) {wd.draw=()=>{};wd.area="";}
draw();
