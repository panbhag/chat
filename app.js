const express = require('express')
const app = express()
//const port = 3000
const http = require('http');
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);

const redis = require('redis');

let redisSubscriber = redis.createClient();
redisSubscriber.connect();


//redisClient.publish("a", "b");

let redisPublisher = redisSubscriber.duplicate();
redisPublisher.connect();


// redisSubscriber.on("message", function (channel, message) {
//     console.log("redis Message: " + message + " on channel: " + channel + " is arrive!");
//     io.to(channel).emit('chat message', message);
// });

let port = process.argv[2] || 3000;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

function checkSameServer(id){
    if(id === port){
        return true
    }
}

function addChannel(channel){
    if(existingRooms[channel]){
        return
    }
    redisSubscriber.subscribe(channel,(message)=>{
        console.log("redis Message: ", message);
        // if(checkSameServer(id)){
        //     return;
        // }
        io.to(channel).emit('chat message', message);
    });
    existingRooms[channel] = 1
}

let existingRooms = {}

io.on('connection',(socket)=>{
    console.log("a user connected");
    let channel = 'default';
    socket.on("subscribe", (data)=>{
        console.log("subscribe",data,data.channel);
        channel = data.channel;
        socket.join(channel);
        addChannel(channel)
        socket.emit('join-confirmed',channel);
        
    })
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        //io.to(channel).emit('chat message', msg);
        redisPublisher.publish(channel,  msg);
    });   
})

server.listen(port, ()=>{
    console.log('listening on *:',port)
})
//app.listen(port, () => console.log("Example app listening on port ${port}!"))