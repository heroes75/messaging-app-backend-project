const { Router } = require("express");
const { readProfile, updateProfile, createProfile } = require("../controllers/profileController");

const profileRouter = Router()

profileRouter.get('/', createProfile)
profileRouter.get('/:profileId', readProfile)
profileRouter.put('/:profileId', updateProfile)

module.exports = profileRouter