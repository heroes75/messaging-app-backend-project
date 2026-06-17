const {Router} = require('express')
const conversationController = require('../controllers/conversationController')
const passport = require('passport')
const { createMessage } = require('../controllers/messagesController')

const conversationRouter = Router()

conversationRouter.post('/', conversationController.createConversation)
conversationRouter.get('/:conversationId', conversationController.readConversation)
conversationRouter.delete('/:conversationId', conversationController.deleteConversation)
conversationRouter.post('/:conversationId/messages', createMessage)

module.exports = conversationRouter
