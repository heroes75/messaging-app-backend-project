const { prisma } = require("../lib/prisma")

async function createOrUpdateGroup(req, res) {
    const user = req.user
    const {participantsId, name} = req.body
    const {conversationId} = req.params
    console.log('conversationId:', conversationId)

    const isYourFriends = await prisma.friendship.findMany({
        where: {
            OR: [
                {
                    userIdOne: user.id,
                    userIdTwo: {
                        in: participantsId
                    },
                    status: 'FRIEND'
                },
                {
                    userIdTwo: user.id,
                    userIdOne: {
                        in: participantsId
                    },
                    status: 'FRIEND'
                }
            ]
        }
    })
    console.log('isYourFriends:', isYourFriends)
    console.log('participantsId:', participantsId)
    if(isYourFriends.length !== participantsId.length) return res.status(400).json({msg: "you can make a group only with yours friends"})
    
    // const groups = await prisma.conversations.findUnique({
    //     where: {
    //         id: conversationId || '',
    //         participants: {
    //             some: {
    //                 userId: user.id,
    //                 role: 'ADMIN',
    //             }
    //         }
    //     }
    // })
    // console.log('groups:', groups)
    // const
    const group = await prisma.conversations.upsert({
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
            name,
            isGroup: true,
            participants: {
                create: participantsId.concat(user.id).map(participant => ({userId: participant, role: participant === user.id ? 'ADMIN' : 'MEMBERS'})),
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
    res.json({group})
}

async function getAllGroup(req, res) {
    const user = req.user
    const groups = await prisma.conversations.findMany({
        where: {
            isGroup: true,
            participants: {
                some: {
                    userId: user.id
                }
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
    res.json({groups})
}

async function deleteGroup(req, res) {
    const user = req.user
    const {conversationId} = req.params;

    const conversation = await prisma.conversations.findFirst({
        where: {
            participants: {
                some: {
                    userId: user.id,
                    role: 'ADMIN'
                }
            }
        }
    })

    if(!conversation) return res.status(404).json({error: 'conversation not found'})
    const deletedGroup = await prisma.conversations.delete({
        where: {
            id: conversationId
        }
    })

    res.json({conversation: deletedGroup})
}

async function readGroup(req, res) {
    const user = req.user
    const {conversationId} = req.params

    const conversation = await prisma.conversations.findUnique({
        where: {
            id: conversationId,
            participants: {
                some: {
                    userId: user.id
                }
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
            messages: true
        }
    })

    if(!conversation) return res.status(404).json({error: 'this conversation don\'t exist'})
    res.json({conversation})
}

module.exports = {
    createOrUpdateGroup,
    getAllGroup,
    deleteGroup,
    readGroup,
}