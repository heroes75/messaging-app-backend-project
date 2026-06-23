const { prisma } = require("../lib/prisma");

module.exports = async function homeController(req, res) {
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
            friendSecond: true
        }
    })
    res.json({user})
}