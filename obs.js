const WebSocketClient = require('websocket').client
const EventEmitter = require('events')

const client = new WebSocketClient()
let socket
let obs = new EventEmitter()

client.on('connectFailed', function(error) {
    console.log(`Connect Error: ${error.toString()}`)
});

client.on('connect', (connection) => {
    socket = connection
    console.log(`WebSocket Client Connected`)
    connection.on('error', (error) => {
        console.log(`Connection Error: ${error.toString()}`)
    })

    connection.on('close', () => {
        console.log(`Connection Closed`)
    })

    connection.on('message', function(message) {
        if(message.type === 'utf8') {
            obs.emit('message', JSON.parse(message.utf8Data))
            //console.log(JSON.parse(message.utf8Data))
        }
    })

     obs.send('GetVersion')
     obs.send('GetCurrentScene')

})

client.connect('ws://DESKTOP-TKAGNIC:4444/')

/**
 * 
 * @param {String} request 
 * @param {Object} params 
 */
obs.send = (request, params) => {
    const data = params ? params : {}
    data['request-type'] = request
    data['message-id'] = request
    socket.send(JSON.stringify(data))
}


module.exports = obs