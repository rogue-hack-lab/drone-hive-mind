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
	Throttle      float64 `json:"t"`
	Rudder        float64 `json:"r"`
	Aileron       float64 `json:"a"`
	Elevator      float64 `json:"e"`
	LastUpdate    time.Time
	Clients       int
	ActiveClients int
}

var addr = flag.String("addr", ":3001", "http service address")
var clientTimeout = flag.Int("timeout", 5, "time in seconds to keep client active before removing data from average")

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

func serveControls(hub *Hub, w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL)

	ctrl := &Controls{
		Throttle:   0,
		Rudder:     0,
		Aileron:    0,
		Elevator:   0,
		LastUpdate: time.Time{},
		Clients:    0,
	}

	i := float64(0)
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
		ctrl.ActiveClients = int(i)
	}
	ctrl.Clients = len(hub.clients)

	if err := json.NewEncoder(w).Encode(ctrl); err != nil {
		fmt.Printf("error marshaling json: %v", err)
	}
	log.Printf("clients: %v", len(hub.clients))
}

func main() {
	flag.Parse()
	hub := newHub()
	go hub.run()

	http.Handle("/", http.StripPrefix("/", http.HandlerFunc(static_handler)))

	http.HandleFunc("/c", func(w http.ResponseWriter, r *http.Request) {
		serveControls(hub, w, r)
	})

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})

	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}

}
