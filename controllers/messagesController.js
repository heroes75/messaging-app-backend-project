const { prisma } = require("../lib/prisma")


async function createMessage(req, res) {
    const user = req.user
    const {conversationId} = req.params
    console.log('conversationId:', conversationId)
    const {message} = req.body
    const conversation = await prisma.conversations.findUnique({
        where: {
            id: conversationId
        },
        include: {
            participants: true
        }
    })

    if(!conversation) return res.status(404).json({msg: "this conversation doesn\'t exits"})
    
    const createdMessage = await prisma.message.create({
        data: {
            message,
            conversationId,
            userId: user.id
        }
    })

    const otherUsers = conversation.participants.filter(participant => participant.userId !== user.id).map(participant => ({id: participant.userId}))
    const notification = await prisma.notifications.create({
        data: {
            notification: `${user.username} send you a message`,
            user: {connect: otherUsers.length === 1 ? otherUsers[0] : otherUsers}
        }
    })

    res.json({message: createdMessage})
}

async function editMessage(req, res) {
    const user = req.user
    const {conversationId} = req.params
    const {messageId} = req.params
    const {message} = req.body
    const conversation = await isRealConversation(conversationId)

    if(!conversation) return res.status(404).json({msg: "this conversation doesn\'t exits"})
    const result = await  messageStatus(messageId, user.id, res)
    if(result) return result
        const updatedMessage = await prisma.message.update({
            where: {
                id: messageId,
            },
            data: {
                message,
            },
        });
        res.json({ message: updatedMessage });
   
    
}

async function isRealConversation(conversationId) {
    return await prisma.conversations.findUnique({
        where: {
            id: conversationId
        },
        include: {
            participants: true
        }
    })
}

async function messageStatus(messageId, userId, res) {
    const message = await prisma.message.findUnique({
        where: {
            id: messageId
        }
    })
    if(!message) return res.status(404).json({error: "message not found"})
    if(message.userId !== userId) return res.status(401).json({error: "Unauthorized"})
    return false
}

async function deleteMessage(req, res) {
    const user = req.user
    const {conversationId} = req.params
    const {messageId} = req.params
    const conversation = await isRealConversation(conversationId)

    if(!conversation) return res.status(404).json({msg: "this conversation doesn\'t exits"})
    const result = await  messageStatus(messageId, user.id, res)
    if(result) return result
    const deleteMessage = await prisma.message.delete({
        where: {
            id: messageId
        }
    })

    res.json({msg: deleteMessage})
}

module.exports = {
    createMessage,
    editMessage,
    deleteMessage
}