const { prisma } = require("../lib/prisma")


async function createMessage(req, res) {
    const {conversationId} = req.params
    console.log('conversationId:', conversationId)
    const {message} = req.body
    const conversation = await prisma.conversations.findUnique({
        where: {
            id: conversationId
        }
    })

    if(!conversation) return res.status(500).json({msg: "this conversation doesn\'t exits"})
    
    const createdMessage = await prisma.message.create({
        data: {
            message,
            conversationId,
            userId: req.user.id
        }
    })

    res.json({message: createdMessage})
}

module.exports = {
    createMessage
}