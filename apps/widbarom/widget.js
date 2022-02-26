(() => {
  var width = 24; // width of the widget
  var currentPressure={'time':Date(), 'pressure':0};
  var lastPressure={'time':Date(Date().getTime()-1000), 'pressure':0};
  function draw() {
    // DO nothing, a pure background widget
  }

  function updateData() {
    function baroHandler(data) {
      if (data===undefined) // workaround for https://github.com/espruino/BangleApps/issues/1429
        setTimeout(() => Bangle.getPressure().then(baroHandler), 500);
      else {
        lastPressure = currentPressure;
        currentPressure={'time':Date().getTime(), 'pressure':  data.pressure};
        Bangle.setBarometerPower(false);
      }
    }
    Bangle.setBarometerPower(true);
    Bangle.getPressure().then(baroHandler);
  }

  function getLastPressure(){
    return currentPressure.pressure;
  }

  function getChange(){
    dt=(currentPressure.time-lastPressure.time)/(1000*60*60);
    dp=currentPressure.pressure-lastPressure.pressure;
    return dp/dt;
  }
  
  setInterval(function() {
    WIDGETS["widbarom"].updateData(WIDGETS["widbarom"]);
  }, 1*6000); // update every 0.1 minutes

  // add your widget
  WIDGETS["widbarom"]={
    area:"tl", // tl (top left), tr (top right), bl (bottom left), br (bottom right)
    width: width, // how wide is the widget? You can change this and call Bangle.drawWidgets() to re-layout
    draw:draw, // called to draw the widget
    updateData:updateData,
    getChange:getChange,
    getLastPressure: getLastPressure
  };
})()
