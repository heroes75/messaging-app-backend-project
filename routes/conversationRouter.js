const {Router} = require('express')
const conversationController = require('../controllers/conversationController')
const passport = require('passport')
const { createMessage, editMessage, deleteMessage, validateFiles, validateMessage } = require('../controllers/messagesController')

const conversationRouter = Router()

conversationRouter.get('/', conversationController.getAllConversations)
conversationRouter.post('/', conversationController.createConversation)
conversationRouter.get('/:conversationId', conversationController.readConversation)
conversationRouter.delete('/:conversationId', conversationController.deleteConversation)
conversationRouter.post('/:conversationId/messages', validateFiles, validateMessage, createMessage)
conversationRouter.put('/:conversationId/messages/:messageId', editMessage)
conversationRouter.delete('/:conversationId/messages/:messageId', deleteMessage)

module.exports = conversationRouter
