import * as d3 from "d3";
import * as transition from "d3-transition";
import debounce from 'lodash/debounce';
console.log('debounce', debounce);
let app = document.querySelector('#app');

app.innerHTML = '<div id="log"></div><div id="controls"></div>';

window.onload = function () {

    const width = 300;
    const height = width;

    const calibrateScale = (inputX, inputY) => {
        return {
            x: inputX/width,
            y: inputY/height
        };
    }

    const memoizeAndSendPoints = (leftFunc, rightFunc) => {
        let leftCache = {};
        let rightCache = {};
        return (...args) => {
            let n1 = args[0];
            let n2 = args[1];
            // here I want to check which args have just left, just right, or both 
            if(n1 && n2) {
                // check if either set of values changed
                if(n1 in leftCache && n2 in rightCache) {
                    return;
                } else return sendPoints(n1.y, n1.x, n2.x, n2.y);
            } else if (n1 && !n2) {
                if(n2 in rightCache) {
                    sendPoints(n1.y, n1.x, rightCache[n2.x], rightCache[n2.y]);
                }
                // check if n1 changed and use cached n2
            } else if (n2 && !n1) {
                // check if n2 changed and use cached n1
            };

            if (n in cache) {
                return sendPoints(cache[n]);
            }
            else {
                console.log('result changed therefore dispatch');
                let result = fn(n);
                console.log('result', result);
                cache[n] = result;
                // we should debounce in sendPoints
                return sendPoints(result);
            }
        }
    }

    const memoizedCalibratedScale = memoizeAndSendPoints(calibrateScale);

  function dragstarted() {
    this.parentNode.appendChild(this);

    d3.select(this).transition()
        .duration(500)
        .attr("r", 48);
  }

  function draggedLeft(d) {
    const x = memoizedCalibratedScale(d[0]);
    const y = memoizedCalibratedScale(d[1]);
    memoizedCalibratedScale()
    console.log('left', d);
    dragged(d, this);
  }

  function draggedRight(d) {
    console.log('right', d);
    dragged(d, this);
  }

  function bounds(x) {
      if (x > width) {
          return width
      }
      if (x < 0) {
          return 1
      }
      return x
  }

  function dragged(d, t) {
    d[0] = bounds(d3.event.x);
    d[1] = bounds(d3.event.y);

    d3.select(t)
        .attr("transform", "translate(" + d + ")");
  }

  function dragended() {
    d3.select(this).transition()
        .duration(500)
        .attr("r", 32);
  }

  function nozoom() {
    d3.event.preventDefault();
  }

  // const width = self.frameElement ? 400 : innerWidth;
  // const height = self.frameElement ? 400 : innerHeight;

  const rightData = d3.range(1).map(function() { return [width, height]; });
  const rightControllerId = 'right-controller';

  const leftData = d3.range(1).map(function() { return [width, height]; });
  const leftControllerId = 'left-controller';

  const dragLeft = d3.drag()
      .on("start", dragstarted)
      .on("drag", draggedLeft)
      .on("end", dragended);

  const dragRight = d3.drag()
      .on("start", dragstarted)
      .on("drag", draggedRight)
      .on("end", dragended);

    d3.select("#controls")
      .on("touchstart", nozoom)
      .on("touchmove", nozoom)
    .append("svg")
      .attr("id", leftControllerId)
      .attr("width", width)
      .attr("height", height)
      .attr("style", "border: 1px solid #000;")
    .selectAll("circle")
      .data(leftData)
      .enter().append("circle")
      .attr("r", 32)
      .attr("transform", "translate("+(width/2)+","+(height/2)+")")
      .attr("style", "top: 50%; left: 50%;")
      .style("fill", function(d, i) { return 'orange'; })
      .call(dragLeft);

    d3.select("#controls")
      .on("touchstart", nozoom)
      .on("touchmove", nozoom)
    .append("svg")
      .attr("id", rightControllerId)
      .attr("width", width)
      .attr("height", height)
      .attr("style", "border: 1px solid #000;")
    .selectAll("circle")
      .data(rightData)
      .enter().append("circle")
      .attr("r", 32)
      .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")")
      .attr("style", "top: 50%; left: 50%;")
      .style("fill", function(d, i) { return 'blue'; })
      .call(dragRight);

    var conn;
    var log = document.getElementById("log");

    function appendLog(item) {
        var doScroll = log.scrollTop > log.scrollHeight - log.clientHeight - 1;
        log.appendChild(item);
        if (doScroll) {
            log.scrollTop = log.scrollHeight - log.clientHeight;
        }
    }
// what is the expected default or null for each? or do I have to include all 4 on every disp
// just dont send data is my thought... but I will add defaults
// so if I'm only changing throttle and rudder, what do I send 
// you need to keep sending the other values - whatever it was reading last
// ah, so do the cached values ... got it, going back to the memoize func
function sendPoints(throttle,rudder,aileron,elevator) {
        var controls = {
            t: throttle, //left stick up down (y) 0
            r: rudder,   //left stick left right (x) 0.5
            a: aileron,  //right stick left right (x) 0.5
            e: elevator  //right stick up down (y) 0.5
        }
        conn.send(JSON.stringify(controls));
    }

    if (window["WebSocket"]) {
        conn = new WebSocket("ws://" + document.location.host + "/ws");

        conn.onopen = function (event) {
            // setInterval(sendRand, 5000);
        };

        conn.onclose = function (event) {
            var item = document.createElement("div");
            item.innerHTML = "<b>Connection closed.</b>";
            appendLog(item);
        };

        conn.onmessage = function (event) {
            // no messages expected yet

        };
    } else {
        var item = document.createElement("div");
        item.innerHTML = "<b>Your browser does not support WebSockets.</b>";
        appendLog(item);
    }
}
