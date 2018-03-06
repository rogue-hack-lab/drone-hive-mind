import * as d3 from "d3";
import * as transition from "d3-transition";

let app = document.querySelector('#app');

app.innerHTML = '<div id="log"></div>';

window.onload = function () {

  function dragstarted() {
    this.parentNode.appendChild(this);

    d3.select(this).transition()
        .duration(500)
        .attr("r", 48);
  }

  function dragged(d) {
    d[0] = d3.event.x;
    d[1] = d3.event.y;
    console.log('d', d, 'd3.event', d3.event);

    d3.select(this)
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

  const width = 400;
  const height = 400;

  const rightData = d3.range(1).map(function() { return [width, height]; });
  const rightControllerId = 'right-controller';

  const leftData = d3.range(1).map(function() { return [width, height]; });
  const leftControllerId = 'left-controller';

  const drag = d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);

  d3.select("div")
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
      .attr("style", "top: 50%; left: 50%;")
      .style("fill", function(d, i) { return 'orange'; })
      .call(drag);

  d3.select("div")
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
      .attr("style", "top: 50%; left: 50%;")
      .style("fill", function(d, i) { return 'blue'; })
      .call(drag);

    var conn;
    var log = document.getElementById("log");

    function appendLog(item) {
        var doScroll = log.scrollTop > log.scrollHeight - log.clientHeight - 1;
        log.appendChild(item);
        if (doScroll) {
            log.scrollTop = log.scrollHeight - log.clientHeight;
        }
    }

    function sendRand() {
        var controls = {
            t: Math.random(),
            r: Math.random(),
            a: Math.random(),
            e: Math.random()
        }
        conn.send(JSON.stringify(controls));
    }

    if (window["WebSocket"]) {
        conn = new WebSocket("ws://" + document.location.host + "/ws");

        conn.onopen = function (event) {
            setInterval(sendRand, 5000);
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
