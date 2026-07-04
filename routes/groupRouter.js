const { Router } = require("express");
const { getAllGroup, createOrUpdateGroup, deleteGroup, readGroup } = require("../controllers/groupController");
const { createMessage, editMessage, deleteMessage, validateFiles, validateMessage } = require('../controllers/messagesController')

const groupRouter = Router()

groupRouter.get('/', getAllGroup)
groupRouter.post('/', createOrUpdateGroup)
groupRouter.get('/:conversationId', readGroup)
groupRouter.put('/:conversationId', createOrUpdateGroup)
groupRouter.delete('/:conversationId', deleteGroup)
groupRouter.post('/:conversationId/messages', validateFiles, validateMessage, createMessage)
groupRouter.put('/:conversationId/messages/:messageId', editMessage)
groupRouter.delete('/:conversationId/messages/:messageId', deleteMessage)

module.exports = groupRouter