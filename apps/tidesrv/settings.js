(function(back) {
  var FILE = "tidesrv.json";
  // Load settings
  var settings = Object.assign({
    tidesite: 'reykjavik',
    nr: 6
  }, require('Storage').readJSON(FILE, true) || {});

  function writeSettings() {
    require('Storage').writeJSON(FILE, settings);
  }
  // Show the menu
  // stuff = global.tidesrv.getTideStations();
  let str = "https://tideapi.spliff-donk.de/stations/list";
  Bangle.http(str, {timeout:10000}).then(data=>{
    let stuff = JSON.parse(data.resp);
    global.tidesrv.laststuff = stuff;
    E.showMenu({
      "" : { "title" : "App Name" },
      "< Back" : () => back(),
      'Site?': {
        value: 0|settings.id,  // 0| converts undefined to 0
        min: 0, max: stuff.length-1,
        format : v => stuff[v].id,
        onchange: v => {
          settings.tidesite = stuff[v].id;
          settings.nr = v;
          writeSettings();
          global.tidesrv.refreshTideFile();
        }
      }
    });
  });
})
