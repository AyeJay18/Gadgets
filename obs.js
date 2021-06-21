const WebSocketClient = require('websocket').client
const EventEmitter = require('events')

const client = new WebSocketClient()
let socket
let obs = new EventEmitter()

client.on('connectFailed', function(error) {
    console.log(`Connection to OBS failed: ${error.toString()}`)
    setTimeout(obsConnect, 10*1000)
});

client.on('connect', (connection) => {
    socket = connection
    console.log(`Connected to OBS`)
    connection.on('error', (error) => {
        console.log(`Error Connecting to OBS: ${error.toString()}`)
    })

    connection.on('close', () => {
        console.log(`Connection to OBS Closed`)
        setTimeout(obsConnect, 10*1000)
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

obs.send = (request, params) => {
    const data = params ? params : {}
    data['request-type'] = request
    data['message-id'] = request
    socket.send(JSON.stringify(data))
}

function obsConnect() {
    client.connect('ws://DESKTOP-TKAGNIC:4444/')
}

obsConnect()

module.exports = obs