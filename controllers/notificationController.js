const { prisma } = require("../lib/prisma")


async function getAllNotifications(req, res) {
    const user = req.user
    const notifications = await prisma.notifications.findMany({
        where: {
            userId: user.id
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
    res.json({notifications})
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

async function updateNotification(req, res) {
    const user = req.user
    const {notificationId} = req.params
    const notification = await prisma.notifications.findUnique({
        where: {
            id: notificationId
        }
    })

    if(!notification) return res.status(404).json({error: "notification not found"})
    if(notification.userId !== user.id) return res.status(401).json({error: 'Unauthorize'})

    const updatedNotification = await prisma.notifications.update({
        where: {
            id: notificationId
        },
        data: {
            status: 'READ'
        }
    })
    res.json({notification: updatedNotification})
}

module.exports = {
    getAllNotifications,
    deleteNotif,
    updateNotification
}