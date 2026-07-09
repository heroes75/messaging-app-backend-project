const { body, validationResult, matchedData } = require("express-validator")
const { prisma } = require("../lib/prisma");


const validateMessage = body("message").notEmpty().isString().withMessage("your message must be a string");
const validateFiles = body("file").optional().isObject().withMessage("your files must be an object");


async function createMessage(req, res) {
    const user = req.user
    const {conversationId} = req.params
    console.log('conversationId:', conversationId)
    const result = validationResult(req)
    const errors = result.array()
    if (!result.isEmpty()) {
        return res.status(401).json({msg: errors})
    }
    const {message, file} = matchedData(req)
    console.log('message, file:', message, file)
    const conversation = await prisma.conversations.findUnique({
        where: {
            id: conversationId,
            participants: {
                some: {
                    userId: user.id
                }
            }
        },
        include: {
            participants: true
        }
    })

    if(!conversation) return res.status(404).json({msg: "this conversation doesn\'t exits"})
    
    const otherUsers = conversation.participants.filter(participant => participant.userId !== user.id).map(participant => ({
        notification: conversation.isGroup ? `${user.username} send a message in your group "${conversation.name}"` : `${user.username} send you a message`,
        userId: participant.userId,
    }))
    console.log('otherUsers:', otherUsers)
    const notification = await prisma.notifications.createMany({
        data: otherUsers
    })

    if (file) {
        console.log('file:', file)
        const createdMessage = await prisma.message.create({
            data: {
                message,
                conversationId,
                userId: user.id,
                MessageAttachments: {
                    create: {
                        attachmentUrl: file.eager[0].url,
                        attachmentType: file.format,
                        attachmentName: file.original_filename,
                    },
                },
            },
            include: {
                MessageAttachments: true,
                user: {
                    omit: {
                        password: true
                    }
                }
            },
        });
        return res.json({ message: createdMessage });
    }

    const createdMessage = await prisma.message.create({
        data: {
            message,
            conversationId,
            userId: user.id,
        },
        include: {
            MessageAttachments: true,
            user: {
                omit: {
                    password: true
                }
            }
        }
    })

    console.log('createdMessage:', createdMessage)
    res.json({message: createdMessage})
}

async function editMessage(req, res) {
    const user = req.user
    const {conversationId} = req.params
    const {messageId} = req.params
    const {message} = req.body
    const conversation = await isRealConversation(conversationId)

    if(!conversation) return res.status(404).json({msg: "this conversation doesn\'t exits"})
    const result = await  messageStatus(messageId, user.id, res)
    if(result) return result
        const updatedMessage = await prisma.message.update({
            where: {
                id: messageId,
            },
            data: {
                message,
            },
        });
        res.json({ message: updatedMessage });
   
    
}

async function isRealConversation(conversationId) {
    return await prisma.conversations.findUnique({
        where: {
            id: conversationId
        },
        include: {
            participants: true
        }
    })
}

async function messageStatus(messageId, userId, res) {
    const message = await prisma.message.findUnique({
        where: {
            id: messageId
        }
    })
    if(!message) return res.status(404).json({error: "message not found"})
    if(message.userId !== userId) return res.status(401).json({error: "Unauthorized"})
    return false
}

async function deleteMessage(req, res) {
    const user = req.user
    const {conversationId} = req.params
    const {messageId} = req.params
    const conversation = await isRealConversation(conversationId)

    if(!conversation) return res.status(404).json({msg: "this conversation doesn\'t exits"})
    const result = await  messageStatus(messageId, user.id, res)
    if(result) return result
    const deleteMessage = await prisma.message.delete({
        where: {
            id: messageId
        }
    })

    res.json({msg: deleteMessage})
}

module.exports = {
    validateMessage,
    validateFiles,
    createMessage,
    editMessage,
    deleteMessage
}