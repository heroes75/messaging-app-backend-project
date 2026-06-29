require('dotenv').config()
const express = require('express')
const cors = require('cors')
const {createServer} = require('node:http')
const { Server } = require('socket.io')
const passport = require('passport')
const jwtStrategy = require('./utils/jwt')
const signupRouter = require('./routes/signupRouter')
const loginRouter = require('./routes/loginRouter')
const conversationRouter = require('./routes/conversationRouter')
const friendshipRouter = require('./routes/friendshipRouter')
const notificationRouter = require('./routes/notificationRouter')
const homeRouter = require('./routes/homeRouter')
const verifyToken = require('./utils/verifyToken')
const profileRouter = require('./routes/profileRouter')
const searchUserRouter = require('./routes/searchUserRouter')

const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173']
    }
})

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors())
passport.use(jwtStrategy)

io.on('connection', (socket) => {
    console.log('a user connected')
})

app.use('/', homeRouter)
app.use('/signup', signupRouter)
app.use('/login', loginRouter)
app.use('/conversation', passport.authenticate('jwt', {session: false}), conversationRouter)
app.use('/friendship', passport.authenticate('jwt', {session: false}), friendshipRouter)
app.use('/notification', passport.authenticate('jwt', {session: false}), notificationRouter)
app.use('/profile', passport.authenticate('jwt', {session: false}), profileRouter)
app.use('/user', passport.authenticate('jwt', {session: false}), searchUserRouter)

server.listen(process.env.PORT, () => {
    console.log(`listen ot port  http://localhost:${process.env.PORT}`)
})