let app = document.querySelector('#app')

app.innerHTML = '<div id="log"></div>'
    

window.onload = function () {
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
        controls = {
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
            // right now this is just receiving back all messages from all clients
        };
    } else {
        var item = document.createElement("div");
        item.innerHTML = "<b>Your browser does not support WebSockets.</b>";
        appendLog(item);
    }
}