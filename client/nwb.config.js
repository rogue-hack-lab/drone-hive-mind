module.exports = {
  type: 'web-app',
  devServer: {
    socket: 'socket',
    proxy: {
      "/ws": {
        target: 'ws://localhost:3000',
        ws: true,
      },
      "/c": "http://localhost:3000"
    }
  }
}
