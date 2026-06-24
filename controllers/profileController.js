const { prisma } = require("../lib/prisma")

async function readProfile(req, res) {
    const {profileId} = res.params
    const profile = await prisma.profile.findUnique({
        where: {
            id: profileId,
        }
    })

    if(!profile) return res.status(404).json({error: 'Not Found'})
    if(profile.userId !== req.user.id) return res.status(401).json({error: 'Unauthorize'})
    res.json({profile})
}


async function updateProfile(req, res) {
    const {profileId} = res.params
    const {bio, lastName, firstName} = req.body
    const profile = await prisma.profile.findUnique({
        where: {
            id: profileId,
        }
    })

    if(!profile) return res.status(404).json({error: 'Not Found'})
    if(profile.userId !== req.user.id) return res.status(401).json({error: 'Unauthorize'})
    const updatedProfile = await prisma.profile.update({
        where: {
            id: profileId
        },
        data: {
            lastName,
            firstName,
            bio
        }
    })
}

async function createProfile(req, res) {
    const user = req.user
    const {lastName, firstName, bio} = req.body
    const profile = await prisma.profile.create({
        data: {
            userId: user.id,
            lastName,
            firstName,
            bio,
        }
    })
}

module.exports = {
    readProfile,
    updateProfile,
    createProfile,
}