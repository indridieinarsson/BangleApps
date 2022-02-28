// WIDGETS = {}; // <-- for development only
(() => {
    var width = 0; // width of the widget
    var buflen = 200;
    var pressures=Float32Array(buflen);
    var times=Uint32Array(buflen);
    var head=0;
    // var currentPressure={'time':Math.round(Date().getTime()/10000), 'pressure':0};
    // var lastPressure={'time': Math.round((Date(Date().getTime()-100000)).getTime()/10000), 'pressure':0};
    var intervalId=-1;
    function draw() {
        // DO nothing, a pure background widget
    }

    function stepBack(tail){
        return (tail==0?buflen-1:tail-1);
    }

    function updateData() {
        function baroHandler(data) {
            if (data===undefined){ // workaround for https://github.com/espruino/BangleApps/issues/1429
                console.log("undefined barometer data")
                setTimeout(() => Bangle.getPressure().then(baroHandler), 500);
            }
            else if (data.pressure==0){
                console.log("barometer data 0")
                setTimeout(() => Bangle.getPressure().then(baroHandler), 500);
            }
            else {
                console.log("got barometer data " + data.pressure)
                //lastPressure = currentPressure;
                //currentPressure={'time':Math.round(Date().getTime()/10000), 'pressure':  data.pressure};
                pressures[head] = data.pressure;
                times[head] = Math.round(Date().getTime()/10000);
                if (++head >= buflen){ head=0; }
                Bangle.setBarometerPower(false);
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

    function getChange(){
        var tail=head;
        var lastix = stepBack(head);
        var tlast = times[lastix];
        for(let i=0; i<buflen; i++)
        {
            let tailtmp=stepBack(tail);
            if (times[tailtmp]==0)
            {
                dt = (tlast-times[tail])/360;
                dp = pressures[lastix]-pressures[tail];
                return dp/dt;
                break;
            }
            tail=tailtmp;
            if ((tlast-times[tail])>359)
            {
                dt = (tlast-times[tail])/360;
                dp = pressures[lastix]-pressures[tail];
                return dp/dt;
                break;
            } 
        }
        // dt=(currentPressure.time-lastPressure.time)/(1000*60*60.0);
        // dp=currentPressure.pressure-lastPressure.pressure;
        // return dp/dt;
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
    
    newInterval(10*60*1000);

    // add your widget
    WIDGETS["widbarom"]={
        area:"tl", // tl (top left), tr (top right), bl (bottom left), br (bottom right)
        width: width, // how wide is the widget? You can change this and call Bangle.drawWidgets() to re-layout
        draw:draw, // called to draw the widget
        updateData:updateData,
        getChange:getChange,
        getLastPressure: getLastPressure,
        newInterval: newInterval
    };
})()
//Bangle.drawWidgets(); // <-- for development only
