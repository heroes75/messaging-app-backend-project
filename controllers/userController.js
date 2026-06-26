const { query, validationResult, matchedData } = require("express-validator")
const { prisma } = require("../lib/prisma")

const validQuery =  query('username').isString().withMessage('your query must be a string').notEmpty().withMessage('search input empty')

async function searchUser(req, res) {
    const user = req.user
    const result = validationResult(req)
    const errors = result.array()
    if (!result.isEmpty()) {
        return res.json({errors})
    }
    const {username} = matchedData(req)
    const users = await prisma.user.findMany({
        where: {
            OR: [
                {
                    username: {
                        startsWith: username
                    }
                },
                {
                    username: {
                        contains: username
                    }
                }
            ],
            NOT: {
                id: user.id
            }
        },
        omit: {
            password: true,
        },
        include: {
            friendFirst: {
                where: {
                    userIdTwo: user.id
                }
            },
            friendSecond: {
                where: {
                    userIdOne: user.id
                }
            },
            conversations:{
                where: {
                    conversations: {
                        participants: {
                            some: {
                                userId: user.id
                            }
                        }
                    }
                }
            },
            profile: true
        }
    })

    res.json({users})
}

module.exports = {
    validQuery,
    searchUser,
};