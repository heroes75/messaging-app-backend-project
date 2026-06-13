require('dotenv').config()
const express = require('express')
const {createServer} = require('node:http')
const { Server } = require('socket.io')

const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173']
    }
})

app.get('/', (req, res) => res.json({msg: 'good'}))

io.on('connection', (socket) => {
    console.log('a user connected')
})

server.listen(process.env.PORT, () => {
    console.log(`listen ot port  http://localhost:${process.env.PORT}`)
})