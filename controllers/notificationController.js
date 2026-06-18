const { prisma } = require("../lib/prisma")


async function getAllNotifications(req, res) {
    const user = req.user
    const notifications = await prisma.notifications.findMany({
        where: {
            userId: user.id
        }
    })
    res.json({msg: notifications})
}

async function deleteNotif(req, res) {
    const user = req.user
    const {notificationId} = req.params
    const notification = await prisma.notifications.findUnique({
        where: {
            id: notificationId
        }
    })

    if(!notification) return res.status(404).json({error: "notification not found"})
    if(notification.userId !== user.id) return res.status(401).json({error: 'Unauthorize'})
    
    const deletedNotif = await prisma.notifications.delete({
        where: {
            id: notificationId
        }
    })
    res.json({msg: deletedNotif})
}

module.exports = {
    getAllNotifications,
    deleteNotif
}