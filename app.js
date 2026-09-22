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
const groupRouter = require('./routes/groupRouter')
const { prisma } = require('./lib/prisma')
const { ExpressPeerServer } = require('peer')

const app = express()
const server = createServer(app)
const prePeerServer = app.listen(3001)

const peerServer = ExpressPeerServer(prePeerServer, {
    path: '/'
})


app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors())
passport.use(jwtStrategy)


const io = new Server(server, {
    cors: {
       origin: '*'
   }
})
io.engine.use((req, res, next) => {
    const isHandshake = req._query.sid === undefined
    if(isHandshake) {
        passport.authenticate('jwt', {session: false})(req, res ,next);
    } else {
        next()
    }
})

peerServer.on("connection", (client) => {
  console.log("Connected: ", client.getId());
});

io.on('connection', async (socket) => {
    const username = socket.request.user.username;
    const userId = socket.request.user.id;
    // console.log('USER ' + username + ' connected')
    socket.join(`user:${username}`);
    socket.join(`user:${userId}`);
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        include: {
            conversations: true,
            notifications: true
        }
    })
    user.conversations.forEach(conversation => socket.join(`conversation:${conversation.conversationId}`))
    socket.on('message', (message, notifications) => {
        console.log('notifications:', notifications)
        notifications.forEach(notification => socket.to(`user:${notification.userId}`).emit('notifications', notification))
        socket.to(`conversation:${message.conversationId}`).emit('message', message)
        // socket.broadcast.emit('message', message)
    })
    socket.on('friendFirst', (friendStatus, notification) => {
        console.log('notification first:', notification)
        console.log('friendStatus first:', friendStatus)
        socket.to(`user:${friendStatus.userIdOne}`).emit('friendSecond', friendStatus)
        socket.to(`user:${notification.userId}`).emit('notifications', notification)
    })
    socket.on('friendSecond', (friendStatus, notification) => {
        console.log('notification: second', notification)
        console.log('friendStatus: second', friendStatus)
        socket.to(`user:${friendStatus.userIdTwo}`).emit('friendFirst', friendStatus)
        socket.to(`user:${notification.userId}`).emit('notifications', notification)
    })
    socket.on('call', async (hash, conversationId, {username, id}) => {
        // console.log('hash, conversationId, {username, id}:', hash, conversationId, {username, id})
        const conversation = await prisma.conversations.findUnique({
            where: {
                id: conversationId
            },
            include: {
                participants: true
            }
        })
        const [idOne, idTwo] = [conversation.participants[0].userId, conversation.participants[1].userId]
        const [userIdOne, userIdTwo] = idOne < idTwo ? [idOne, idTwo] : [idTwo, idOne]
        console.log('[userIdOne, userIdTwo]:', [userIdOne, userIdTwo])
        const isFriend = await prisma.friendship.findUnique({
            where: {
                userIdOne_userIdTwo: {
                    userIdOne,
                    userIdTwo,
                },
                status: 'FRIEND',
            }
        })
        console.log('isFriend:', isFriend)
        if (isFriend || conversation.isGroup) {
            socket.to(`conversation:${conversationId}`).emit('calling', hash, {username, id})
        }
        
    })

    socket.on('responseCall', (response, callerId) => {
        socket.to(`user:${callerId}`).emit('response', response, callerId)
    })

    socket.on('video-connected', (conversationId, id) => {
        console.log('conversationId, id:', conversationId, id)
        socket.to(`conversation:${conversationId}`).emit('video-connected', userId)
    })
    socket.on('video-disconnected', (conversationId, id) => {
        console.log('video-disconnected :', conversationId, id)
        socket.to(`conversation:${conversationId}`).emit('video-disconnected', id)
    })

})


app.use('/peerjs', peerServer)
app.use('/', verifyToken, homeRouter)
app.use('/signup', signupRouter)
app.use('/login', loginRouter)
app.use('/user', passport.authenticate('jwt', {session: false}), searchUserRouter)
app.use('/groups', passport.authenticate('jwt', {session: false}), groupRouter)
app.use('/profile', passport.authenticate('jwt', {session: false}), profileRouter)
app.use('/friendship', passport.authenticate('jwt', {session: false}), friendshipRouter)
app.use('/conversation', passport.authenticate('jwt', {session: false}), conversationRouter)
app.use('/notification', passport.authenticate('jwt', {session: false}), notificationRouter)

server.listen(process.env.PORT, () => {
    console.log(`listen on port  http://localhost:${process.env.PORT}`)
})