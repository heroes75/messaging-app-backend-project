const { Router } = require("express");
const { getAllNotifications, deleteNotif } = require("../controllers/notificationController");


const notificationRouter = Router()

notificationRouter.get('/', getAllNotifications)
notificationRouter.delete('/:notificationId', deleteNotif)

module.exports = notificationRouter