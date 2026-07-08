const { body, validationResult, matchedData } = require("express-validator")
const { prisma } = require("../lib/prisma")

const validateName = body('name')
    .isString().withMessage('your name must be a string')
    .optional()
    // .notEmpty().withMessage('Your name must be not empty')

const validateConversation = body('participantsId')
    .isArray({min: 1}).withMessage('you need at least one participant to create a conversation')

const validateGroup = body('participantsId')
    .isArray({min: 2}).withMessage('you need at least two participant to create a group')

async function createConversation(req, res) {
    const user = req.user
    const result = validationResult(req)
    console.log('result:', result)
    const errors = result.array()
    console.log('errors:', errors)
    if (!result.isEmpty()) {
        return res.status(400).json({errors})
    }

    const {participantsId, name} = matchedData(req)
    console.log('{participantsId, name:', participantsId, name)
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
        if(!isYourFriends(participantsId, user.id)) return res.status(400).json({ msg: "you can make a group only with yours friends" });
    }

    const conversation = await prisma.conversations.create({
        data: {
            name: name ? name : user.id + '+' + participantsId[0],
            isGroup: isGroup ? true : false,
            participants: {
                create: participantsId.concat(user.id).map(participant => ({userId: participant, role: (participant === user.id && isGroup) ? 'ADMIN' : 'MEMBERS'})),
            }
        },
        
        include: {
            participants: {
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

    const notificationsArrays = conversation.participants.filter(participant => participant.userId !== user.id).map(participant => ({
        notification: conversation.isGroup ? `${user.username} created a group named ${conversation.name} with you` : `${user.username} open a conversation with you`,
        userId: participant.userId,
    }))

    const notifications = await prisma.notifications.createMany({
        data: notificationsArrays
    })

    console.log('conversation: make', conversation)
    res.json({conversation})
}

async function updateConversation(req, res) {
    const user = req.user
    const {participantsId, name} = req.body
    const {conversationId} = req.params

    const conversation = await prisma.conversations.findUnique({
        where: {
            id: conversationId,
            participants: {
                some: {
                    userId: user.id,
                    role: 'ADMIN'
                }
            }
        }
    })

    console.log('conversation: in update', conversation)
    if(!conversation) return res.status(404).json({error: 'this group don\'t exist'})
    if(!isYourFriends(participantsId, user.id)) return res.status(400).json({ msg: "you can make a group only with yours friends" });
    
    const updatedConversation = await prisma.conversations.update({
        where: {
            id: conversationId,
        },
        data: {
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
        include: {
            participants: {
                include: {
                    user: {
                        omit: {
                            password: true
                        }
                    }
                }
            }
        }
    })

    console.log('updatedConversation:', updatedConversation)
    res.json({conversation: updatedConversation})
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
                    MessageAttachments: true,
                    user: {
                        omit: {
                            password: true
                        }
                    }
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
                    userId: req.user.id,
                    role: 'ADMIN'
                },
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
        res.json({conversation: deleteConversation, msg: 'conversation deleted'})
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

async function isYourFriends(participantsId, userId) {
    const isYourFriend = await prisma.friendship.findMany({
        where: {
            OR: [
                {
                    userIdOne: userId,
                    userIdTwo: {
                        in: participantsId,
                    },
                    status: "FRIEND",
                },
                {
                    userIdTwo: userId,
                    userIdOne: {
                        in: participantsId,
                    },
                    status: "FRIEND",
                },
            ],
        },
    });
    console.log("isYourFriends:", isYourFriend);
    console.log("participantsId:", participantsId);
    if (isYourFriend.length !== participantsId.length) return false;
    return true;
}

module.exports = {
    createConversation,
    readConversation,
    deleteConversation,
    getAllConversations,
    updateConversation,
    validateConversation,
    validateName,
    validateGroup,
}