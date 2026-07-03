const { Router } = require("express");
const { getAllGroup, createOrUpdateGroup } = require("../controllers/groupController");

const groupRouter = Router()

groupRouter.get('/', getAllGroup)
groupRouter.post('/', createOrUpdateGroup)
groupRouter.post('/:conversationId', createOrUpdateGroup)

module.exports = groupRouter