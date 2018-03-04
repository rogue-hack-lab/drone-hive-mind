all: installtools build

installtools:
	go get -u github.com/codegangsta/gin
	go get -u github.com/jteeuwen/go-bindata/...

build-client:
	cd ../client; \
    npm install; \
	npm run build;

pre-build: build-client
	go generate

build: pre-build
	go build -a -o ./drone-hive-mind

build-pi: pre-build
	GOOS=linux GOARCH=arm go build -a -o ./drone-hive-mind-pi

start:
	go generate
	go run *.go

#this is not working right now
start-dev: pre-build
	gin main.go