const { prisma } = require("../lib/prisma")

async function createConversation(req, res) {
    const user = req.user
    const {participantId} = req.body

    const oldConversation = await prisma.conversations.findFirst({
        where: {
            AND: [
                {
                    participants: {
                        some: {
                            userId: user.id,
                        },
                    },
                    participants: {
                        some: {
                            userId: participantId,
                        },
                    },

                },
            ],
        },
    });

    if (oldConversation) {
        return res.json({
            msg: 'This conversation already exist'
        })
    }

    const conversation = await prisma.conversations.create({
        data: {
            name: user.id + "+" + participantId,
            participants: {
                create: [
                    { userId: user.id },
                    { userId: participantId },
                ],
            },
        },
    });
    res.json({conversation, msg: 'new conversation created'})
}

async function readConversation(req, res) {
    const {conversationId} = req.params
    const conversation = await prisma.conversations.findUnique({
        where: {
            id: conversationId
        },
        include: {
            participants: true,
            messages: true
        }
    })

    if (!conversation) {
        return res.json({msg: 'This conversation doesn\'t exits'})
    }
    res.json({conversation})
}

async function deleteConversation(req, res) {
    const {conversationId} = req.params
    const conversation = await prisma.conversations.findUnique({
        where: {
            id: conversationId
        }
    })
    if(!conversation) return res.status(404).json({msg: 'this conversation doesn\'t exists'})
    try {
        const deleteConversation = await prisma.conversations.delete({
            where: {
                id: conversationId,
            },
        });
        res.json({deleteConversation, msg: 'conversation deleted'})
    } catch (error) {
        console.error( error)
        res.status(500).json({msg: "Server Error"})
    }
    
}

module.exports = {
    createConversation,
    readConversation,
    deleteConversation
}