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

    const notifications = await prisma.notifications.create({
        data: {
            notification: `${user.username} open a conversation with you`,
            user: {
                connect: {id: participantId}
            }
        },
    })

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
            messages: {
                orderBy: {
                    createdAt: 'desc'
                }
            }
        },
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

async function getAllConversations(req, res) {
    const user = req.user
    const conversations = await prisma.conversations.findMany({
        where: {
            participants: {
                some: {
                    userId: user.id,
                },
            },
        },
        include: {
            participants: {
                where: {
                    NOT: {
                        userId: user.id,
                    },
                },
                include: {
                    user: true
                }
            },
        },
    });

    res.json({conversations})
}

module.exports = {
    createConversation,
    readConversation,
    deleteConversation,
    getAllConversations,
}