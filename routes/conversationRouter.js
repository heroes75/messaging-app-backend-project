const {Router} = require('express')
const conversationController = require('../controllers/conversationController')
const passport = require('passport')

const conversationRouter = Router()

conversationRouter.get('/', passport.authenticate('jwt', {session: false}), conversationController)

module.exports = conversationRouter
