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
    if(isYourFriends.length !== participantsId.length) return res.status(400).json({msg: "you can group only with your friend"})
    const groups = await prisma.conversations.findUnique({
        where: {
            id: conversationId || '',
            participants: {
                some: {
                    userId: user.id,
                    role: 'ADMIN',
                }
            }
        }
    })
    console.log('groups:', groups)
    const group = await prisma.conversations.upsert({
        where: {
            id: conversationId || '',
            participants: {
                some: {
                    userId: user.id,
                    role: 'ADMIN',
                }
            }
        },
        update: {
            name,
            participants: {
                connect: participantsId.concat(user.id).map(participant => ({userId: participant, role: participant === user.id ? 'ADMIN' : 'MEMBERS'})),
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

async function updateGroup(req, res) {
    const user = req.user
    const {participantsId, name} = req.body;

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
    if(isYourFriends.length !== participantsId.length) return res.status(400).json({msg: "you can group only with your friend"})
    
}

module.exports = {
    createOrUpdateGroup,
    getAllGroup,
}