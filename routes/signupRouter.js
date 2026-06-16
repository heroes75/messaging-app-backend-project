const {Router} = require('express')
const signupController = require('../controllers/signupController')

const signupRouter = Router()

signupRouter.post('/', signupController)

module.exports = signupRouter