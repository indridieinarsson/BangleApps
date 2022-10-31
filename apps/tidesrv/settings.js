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
  stuff = global.tidesrv.getTideStations();
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
})
