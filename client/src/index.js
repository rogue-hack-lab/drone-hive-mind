import * as d3 from "d3";
import * as transition from "d3-transition";

let app = document.querySelector('#app');

app.innerHTML = '<div id="log"></div>';

window.onload = function () {

    var width = self.frameElement ? 960 : innerWidth,
    height = self.frameElement ? 500 : innerHeight;

    var data = d3.range(2).map(function() { return [Math.random() * width, Math.random() * height]; });

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var drag = d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);

    d3.select("body")
        .on("touchstart", nozoom)
        .on("touchmove", nozoom)
      .append("svg")
        .attr("width", width)
        .attr("height", height)
      .selectAll("circle")
        .data(data)
      .enter().append("circle")
        .attr("transform", function(d) { return "translate(" + d + ")"; })
        .attr("r", 32)
        .style("fill", function(d, i) { return color(i); })
        .call(drag);

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
