const { prisma } = require("../lib/prisma");

module.exports = async function homeController(req, res) {
    if(!req.user) return res.status(303).json({url: '/login'})
    console.log('req.user:', req.user)
    const user = await prisma.user.findUnique({
        where: {
            id: req.user.id
        },
        omit: {
            password: true
        },
        include: {
            conversations: true,
            friendFirst: {
                where: {
                    status: 'FRIEND'
                },
                omit: {
                    userIdOne: true
                },
                include: {
                    friendSecond: {
                        omit: {
                            password: true
                        }
                    }
                }
            },
            friendSecond: {
                where: {
                    status: 'FRIEND'
                },
                omit: {
                    userIdTwo: true
                },
                include: {
                    friendFirst: {
                        omit: {
                            password: true
                        }
                    }
                }
            },
            profile: true,
            notifications: true,
        }
    })

    user.friendFirst = user.friendFirst.map(friend => friend.friendSecond)
    user.friendSecond = user.friendSecond.map(friend => friend.friendFirst)
    res.json({user})
}