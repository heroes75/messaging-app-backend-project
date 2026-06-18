const {Router} = require('express')
const conversationController = require('../controllers/conversationController')
const passport = require('passport')
const { createMessage, editMessage, deleteMessage } = require('../controllers/messagesController')

const conversationRouter = Router()

conversationRouter.post('/', conversationController.createConversation)
conversationRouter.get('/:conversationId', conversationController.readConversation)
conversationRouter.delete('/:conversationId', conversationController.deleteConversation)
conversationRouter.post('/:conversationId/messages', createMessage)
conversationRouter.put('/:conversationId/messages/:messageId', editMessage)
conversationRouter.delete('/:conversationId/messages/:messageId', deleteMessage)

module.exports = conversationRouter
