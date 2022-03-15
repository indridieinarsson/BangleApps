var data = WIDGETS.widbarom.zeroBaseData();
g.clear();
Bangle.loadWidgets();
Bangle.drawWidgets();
require("graph.js").drawLine(g, data.pressure, 
                             {x:4, y: 24,
                              height: g.getHeight()-(24+8),
                              xlabel : x=>Date(data.time[x]*10000).getHours(),
                              axes: true,
                              gridx:25, gridy: 25,
                              miny: 950, maxy: 1050
                             });
