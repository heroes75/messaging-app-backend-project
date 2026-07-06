const { prisma } = require("../lib/prisma")

async function createConversation(req, res) {
    const user = req.user
    const {participantsId, name} = req.body
    const {conversationId} = req.params
    const isGroup = participantsId.length !== 1

    if (!isGroup) {
        const oldConversation = await prisma.conversations.findFirst({
            where: {
                AND: [
                    {
                        participants: {
                            some: {
                                userId: user.id,
                            },
                        },
                    },
                    {
                        participants: {
                            some: {
                                userId: participantsId[0],
                            },
                        },
                    },
                ],
            },
            include: {
                participants: true,
            },
        });

        console.log("oldConversation:", oldConversation);

        if (oldConversation) {
            return res.json({
                error: "This conversation already exist",
            });
        }
    } else {
        const isYourFriends = await prisma.friendship.findMany({
            where: {
                OR: [
                    {
                        userIdOne: user.id,
                        userIdTwo: {
                            in: participantsId,
                        },
                        status: "FRIEND",
                    },
                    {
                        userIdTwo: user.id,
                        userIdOne: {
                            in: participantsId,
                        },
                        status: "FRIEND",
                    },
                ],
            },
        });
        console.log("isYourFriends:", isYourFriends);
        console.log("participantsId:", participantsId);
        if (isYourFriends.length !== participantsId.length)
            return res
                .status(400)
                .json({ msg: "you can make a group only with yours friends" });
    }

    const conversation = await prisma.conversations.upsert({
        where: {
            id: conversationId || '',
            participants: {
                some: {
                    userId: user.id,
                    role: 'ADMIN',
                },
            },
        },
        update: {
            name,
            participants: {
                deleteMany: {
                    userId:{
                        notIn: participantsId.concat(user.id)
                    }
                },
                createMany: {
                    data: participantsId.map(participant => ({userId: participant, role: 'MEMBERS'})),
                    skipDuplicates: true,
                },
            }
        },
        create: {
            name: name ? name : user.id + '+' + participantsId[0],
            isGroup: isGroup ? true : false,
            participants: {
                create: participantsId.concat(user.id).map(participant => ({userId: participant, role: (participant === user.id && isGroup) ? 'ADMIN' : 'MEMBERS'})),
            }
        },
        
        include: {
            participants: {
                where: {
                    NOT: {
                        userId: user.id
                    }
                },
                include: {
                    user: {
                        omit: {
                            password: true
                        }
                    }
                }
            },
        }
    })

    const notificationsArrays = conversation.participants.map(participant => ({
        notification: conversation.isGroup ? `${user.username} created a group named ${conversation.name} with you` : `${user.username} open a conversation with you`,
        userId: participant.userId
    }))

    const notifications = await prisma.notifications.createMany({
        data: notificationsArrays
    })

    console.log('conversation: make', conversation)
    res.json({conversation, msg: 'new conversation created'})
}

async function readConversation(req, res) {
    const {conversationId} = req.params
    const conversation = await prisma.conversations.findUnique({
        where: {
            id: conversationId,
            participants: {
                some: {
                    userId: req.user.id
                }
            }
        },
        include: {
            participants: true,
            messages: {
                orderBy: {
                    createdAt: 'asc'
                },
                include: {
                    MessageAttachments: true
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
            id: conversationId,
            participants: {
                some: {
                    userId: req.user.id
                }
            }
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
    console.log('user:', user)
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
                    user: {
                        omit: {
                            password: true,
                        }
                    }
                }
            },
        },
    });

    console.log('conversations:', conversations)
    res.json({conversations})
}

module.exports = {
    createConversation,
    readConversation,
    deleteConversation,
    getAllConversations,
}