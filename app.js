require('dotenv').config()
const express = require('express')
const cors = require('cors')
const {createServer} = require('node:http')
const { Server } = require('socket.io')
const signupRouter = require('./routes/signupRouter')
const loginRouter = require('./routes/loginRouter')

const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173']
    }
})

app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cors())

io.on('connection', (socket) => {
    console.log('a user connected')
})

app.use('/signup', signupRouter)
app.use('/login', loginRouter)

server.listen(process.env.PORT, () => {
    console.log(`listen ot port  http://localhost:${process.env.PORT}`)
})