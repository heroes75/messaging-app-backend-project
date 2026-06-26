const { Router } = require("express");
const { searchUser, validQuery } = require("../controllers/userController");

const searchUserRouter = Router()

searchUserRouter.get('/', validQuery, searchUser)

module.exports = searchUserRouter