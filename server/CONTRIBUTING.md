## Prerequisites

[Golang](https://golang.org/) >= v1.6 must be installed.

## Installation

- Run `go get github.com/rogue-hack-lab/drone-hive-mind` to fetch the project
- Run `cd $GOPATH/src/github.com/rogue-hack-lab/drone-hive-mind/server` to go to the golang server
- Run `make` in the server directory to install everything you need for development

## Development Server

- `make start-dev` will bundle the client assets and run the app's development server at [http://localhost:3000](http://localhost:3000), automatically reloading the page on every change to `.go` files.

## Building

- `make build` creates a binary that includes the client assets.
