const { body, validationResult, matchedData } = require("express-validator");
const { prisma } = require("../lib/prisma");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");


const usernameValidation = body('username')
    .trim()
    .notEmpty().withMessage('Your username must not be empty')

const passwordValidation = body('password')
    .trim()
    .notEmpty().withMessage('Your password must not be empty')
    
async function loginController(req, res) {
    const result = validationResult(req)
    const errors = result.array()
    if (!result.isEmpty()) {
        return res.json({msg: errors.map(error => error.msg)})
    }

    const { username, password} = matchedData(req)
    const user = await prisma.user.findUnique({
        where: {
            username
        },
    })
    if (!user) {
        return res.json({msg: 'incorrect username'})
    }
    const comparePassword = bcrypt.compareSync(password, user.password)
    if(!comparePassword) {
        return res.json({msg: "incorrect password"})
    }

    const token = jwt.sign({user}, process.env.SECRET_KEY, {expiresIn: "1d"})
    return res.json({user, token})
 }

 module.exports = [passwordValidation, usernameValidation, loginController]