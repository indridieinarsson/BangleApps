(function(back) {
  stuff=JSON.parse('[{"id":"thorlakshofn","description":"Þorlákshöfn"},{"id":"grindavik","description":"Grindavík"},{"id":"reykjanesta","description":"Reykjanestá/Röst"},{"id":"sandvik","description":"Sandvík"},{"id":"gardskagi","description":"Garðskagi"},{"id":"reykjavik","description":"Reykjavík"},{"id":"hvalfjordur","description":"Hvalfjörður"},{"id":"grundartangi","description":"Grundartangi"},{"id":"borgarfjordur","description":"Borgarfjörður"},{"id":"longufjorur","description":"Löngufjörur"},{"id":"arnarstapi","description":"Arnarstapi"},{"id":"hornvik","description":"Hornvík"},{"id":"latravik","description":"Látravik"},{"id":"straumnes","description":"Straumnes"},{"id":"holmavik","description":"Hólmavík"},{"id":"husavik","description":"Húsavík"},{"id":"testsite","description":"Testsite"}]');
  
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
  E.showMenu({
    "" : { "title" : "App Name" },
    "< Back" : () => back(),
    'Site?': {
      value: 0|settings.id,  // 0| converts undefined to 0
      min: 0, max: stuff.length-1,
      format : v => stuff[v].id,
      onchange: v => {
        console.log(v);
        settings.tidesite = stuff[v].id;
        settings.nr = v;
        writeSettings();
        global.tidesrv.refreshTideFile();
      }
    },
  });
})
