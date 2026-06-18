const { Router } = require("express");
const {getAllFriends, askFriend, updateFriendship} = require("../controllers/friendshipController");


const friendshipRouter = Router()

friendshipRouter.get('/', getAllFriends)
friendshipRouter.post('/', askFriend)
friendshipRouter.put('/:friendshipId', updateFriendship)

module.exports = friendshipRouter