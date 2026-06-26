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
            friendFirst: true,
            friendSecond: true,
            profile: true,
            notifications: true,
        }
    })
    console.log('user:', user)
    res.json({user})
}