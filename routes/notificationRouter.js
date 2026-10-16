const { Router } = require("express");
const { getAllNotifications, deleteNotif, updateNotification, updateAllNotification } = require("../controllers/notificationController");


const notificationRouter = Router()

notificationRouter.get('/', getAllNotifications)
notificationRouter.put('/', updateAllNotification)
notificationRouter.delete('/:notificationId', deleteNotif)
notificationRouter.put('/:notificationId', updateNotification)

module.exports = notificationRouter