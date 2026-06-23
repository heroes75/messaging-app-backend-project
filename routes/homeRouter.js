const { Router } = require("express");
const homeController = require("../controllers/homeController");
const verifyToken = require("../utils/verifyToken");

const homeRouter = Router()

homeRouter.get('/', verifyToken, homeController)

module.exports = homeRouter