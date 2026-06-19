const { Router } = require("express");
const { getAllNotifications, deleteNotif, updateNotification } = require("../controllers/notificationController");


const notificationRouter = Router()

notificationRouter.get('/', getAllNotifications)
notificationRouter.delete('/:notificationId', deleteNotif)
notificationRouter.put('/:notificationId', updateNotification)

module.exports = notificationRouter