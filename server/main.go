package main

//go:generate go-bindata -prefix "../client/dist" -pkg main -o frontend.go ../client/dist/...

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

type Controls struct {
	Throttle   float64 `json:"t"`
	Rudder     float64 `json:"r"`
	Aileron    float64 `json:"a"`
	Elevator   float64 `json:"e"`
	LastUpdate time.Time
	Running    bool
}

type Meta struct {
	Clients       int
	ActiveClients int
	Running       bool
}

var addr = flag.String("addr", ":80", "http service address")
var clientTimeout = flag.Int("timeout", 3, "time in seconds to keep client active before removing data from average")

func static_handler(rw http.ResponseWriter, req *http.Request) {
	var path string = req.URL.Path
	log.Println(path)
	if path == "" {
		path = "index.html"
	}
	if bs, err := Asset(path); err != nil {
		rw.WriteHeader(http.StatusNotFound)
	} else {
		var reader = bytes.NewBuffer(bs)
		io.Copy(rw, reader)
	}
}

func servePrivate(hub *Hub, meta *Meta, w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL.Path)
	switch r.URL.Path {
	case "/pvt/c":
		if err := json.NewEncoder(w).Encode(getControls(hub, meta)); err != nil {
			fmt.Printf("error marshaling json: %v", err)
		}
	case "/pvt/start":
		meta.Running = true
		fmt.Fprintf(w, "drones starting")
	case "/pvt/stop":
		meta.Running = false
		fmt.Fprintf(w, "drones stoping")
	}
}

func getControls(hub *Hub, meta *Meta) Controls {
	ctrl := Controls{}

	i := float64(0)
	if meta.Running {
		for c := range hub.clients {
			if time.Now().Sub(c.Controls.LastUpdate) < (time.Duration(*clientTimeout) * time.Second) {
				ctrl.Throttle += c.Controls.Throttle
				ctrl.Rudder += c.Controls.Rudder
				ctrl.Aileron += c.Controls.Aileron
				ctrl.Elevator += c.Controls.Elevator
				if c.Controls.LastUpdate.After(ctrl.LastUpdate) {
					ctrl.LastUpdate = c.Controls.LastUpdate
				}
				i++
			}
		}
		if i > 0 {
			ctrl.Throttle = ctrl.Throttle / i
			ctrl.Rudder = ctrl.Rudder / i
			ctrl.Aileron = ctrl.Aileron / i
			ctrl.Elevator = ctrl.Elevator / i
			meta.ActiveClients = int(i)
		}
	} else {
		ctrl.Throttle += 0.0001
		ctrl.Rudder += 0.5
		ctrl.Aileron += 0.5
		ctrl.Elevator += 0.5
	}
	meta.Clients = len(hub.clients)
	ctrl.Running = meta.Running

	return ctrl
}

func main() {
	flag.Parse()
	hub := newHub()
	go hub.run()

	var meta = &Meta{
		Clients:       0,
		ActiveClients: 0,
		Running:       false,
	}

	http.Handle("/", http.StripPrefix("/", http.HandlerFunc(static_handler)))

	http.HandleFunc("/pvt/", func(w http.ResponseWriter, r *http.Request) {
		servePrivate(hub, meta, w, r)
	})

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})

	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}

}
