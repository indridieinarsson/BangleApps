// WIDGETS = {}; // <-- for development only
(() => {
    var width = 0; // width of the widget
    var buflen = 200;
    var head=0;
    var intervalId=-1;

    function initFromFile() {
        let fnamet='widbarom.tdata.bin';
        let fnamep='widbarom.pdata.bin';
        let tbuf = require("Storage").readArrayBuffer('widbarom.tdata.bin');
        let pbuf = require("Storage").readArrayBuffer('widbarom.pdata.bin');
        var pressures=Float32Array(buflen);
        var times=Uint32Array(buflen+1); 
        console.log("initialize...");
        if (typeof tbuf !== 'undefined' && typeof pbuf !== 'undefined'){
            console.log("Initialize from file");
            times      = new Uint32Array(new Uint32Array(tbuf));
            pressures = new Float32Array(new Float32Array(pbuf));
            buflen = pressures.length;
            head = times[buflen];
            console.log("Head : "+head + "  buflen :" + buflen);
        }
    }

    function draw() {
        // DO nothing, a pure background widget
    }

    function stepBack(tail){
        return (tail==0?buflen-1:tail-1);
    }

    function updateData() {
        function baroHandler(data) {
            if (data===undefined){ // workaround for https://github.com/espruino/BangleApps/issues/1429
                console.log("undefined barometer data");
                setTimeout(() => Bangle.getPressure().then(baroHandler), 500);
            }
            else if (data.pressure==0){
                console.log("barometer data 0");
                setTimeout(() => Bangle.getPressure().then(baroHandler), 500);
            }
            else {
                console.log("got barometer data " + data.pressure);
                console.log("Head : "+head + "  buflen :" + buflen);
                //lastPressure = currentPressure;
                //currentPressure={'time':Math.round(Date().getTime()/10000), 'pressure':  data.pressure};
                pressures[head] = data.pressure;
                times[head] = Math.round(Date().getTime()/10000);
                head++;
                if (head >= buflen){ head=0; }
                Bangle.setBarometerPower(false);
                times[buflen]=head;
                console.log("times end ", times[buflen]);
                console.log("Now write pressure data:");
                require("Storage").write('widbarom.pdata.bin', pressures.buffer);
                console.log("Now write time data:");
                require("Storage").write('widbarom.tdata.bin', times.buffer);
                console.log("done writing data");
            }
        }
        Bangle.setBarometerPower(true);
        // wait 10s for barometer to become available
        setTimeout(() => Bangle.getPressure().then(baroHandler), 10000);
    }

    function getLastPressure(){
        tail=stepBack(head);
        return {'time': Date(times[tail]*10000), 'pressure': pressures[tail]};
    }
    
    function getAllPressures() {
        return pressures;
    }
    
    function getAllTimes() {
        return times;
    }

    function getChange(){
        
        var lastix = stepBack(head); // last saved datapoint
        var tlast = times[lastix]; // most recent time
        var tail=lastix;// last saved datapoint
        for(let i=0; i<buflen; i++)
        {
            let tailtmp=stepBack(tail);
            if (times[tailtmp]==0)
            {
                dt = (tlast-times[tail])/360;
                dp = pressures[lastix]-pressures[tail];
                if (dt==0){
                    return 0;
                }
                return dp/dt;
                break;
            }
            tail=tailtmp;
            if ((tlast-times[tail])>359)
            {
                dt = (tlast-times[tail])/360;
                dp = pressures[lastix]-pressures[tail];
                if (dt==0){
                    return 0;
                }
                return dp/dt;
                break;
            } 
        }
    }

    function newInterval(ms){
        if (intervalId==-1){
            console.log("Setting interval");
            intervalId = setInterval(function() {
                WIDGETS["widbarom"].updateData(WIDGETS["widbarom"]);
            }, ms); // update every 0.1 minutes
        }
        else {
            console.log("Changing interval");
            changeInterval(intervalId, ms); // update every 0.1 minutes
        }
    }
    initFromFile();
    newInterval(5*60*1000);

    // add your widget
    WIDGETS["widbarom"]={
        area:"tl", // tl (top left), tr (top right), bl (bottom left), br (bottom right)
        width: width, // how wide is the widget? You can change this and call Bangle.drawWidgets() to re-layout
        head: head,
        draw:draw, // called to draw the widget
        updateData:updateData,
        getChange:getChange,
        getLastPressure: getLastPressure,
        newInterval: newInterval,
        getAllPressures: getAllPressures,
        getAllTimes: getAllTimes
    };
})()
//Bangle.drawWidgets(); // <-- for development only
