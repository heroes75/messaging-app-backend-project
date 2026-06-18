const { prisma } = require("../lib/prisma");


async function getAllFriends(req, res) {
    const user = req.user
    const userInfo = await prisma.user.findMany({
        where: {
            id: user.id
        },
        include: {
            friendFirst: true,
            friendSecond: true
        }
    })
    const [allFriends] = userInfo
    res.json({msg: allFriends.friendFirst.concat(allFriends.friendSecond)})
}

async function askFriend(req, res) {
    const user = req.user
    const {friendId} = req.body
    let [userIdOne, userIdTwo] = user.id < friendId ? [user.id, friendId] : [friendId, user.id]
    // if(user.id < friendId) [userIdOne, userIdTwo] = [friendId, user.id]
    const oldFriendDemand = await prisma.friendship.findUnique({
        where: {
            userIdOne_userIdTwo: {
                userIdOne,
                userIdTwo
            }
        }
    })
    if(oldFriendDemand) return res.status(401).json({error: 'this friendship already exist'})
    const FriendDemand = await prisma.friendship.create({
        data: {
            userIdOne,
            userIdTwo,
            status: user.id === userIdOne ? "REQ_UID1" : "REQ_UID2"
        }
    })

    const notification = await prisma.notifications.create({
        data: {
            notification: `${user.username} send you a friend demand`,
            userId: friendId
        }
    })

    res.json({msg: FriendDemand})
}

async function updateFriendship(req, res) {
    const user = req.user
    const {friendshipId} = req.params
    const {friendshipStatus} = req.body
    const [userIdOne, userIdTwo] = user.id < friendshipId ? [user.id, friendshipId] : [friendshipId, user.id]
    const friendship = await prisma.friendship.findUnique({
        where: {
            userIdOne_userIdTwo: {
                userIdOne,
                userIdTwo,
            },
        },
    });
    if ((userIdOne === user.id && friendship.status === 'REQ_UID2') || (userIdTwo === user.id && friendship.status === 'REQ_UID1')) {
        const updateFriendship = await prisma.friendship.update({
            where: {
                userIdOne_userIdTwo: {
                    userIdOne,
                    userIdTwo
                }
            },
            data: {
                status: friendshipStatus
            }
        })
        return res.json({msg: updateFriendship})
    }

    res.status(401).json({error: 'Unauthorized'})
}

module.exports = {getAllFriends, askFriend, updateFriendship}