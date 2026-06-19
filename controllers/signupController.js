const { body, validationResult, matchedData } = require("express-validator");
const { prisma } = require("../lib/prisma");
const bcrypt = require('bcryptjs')


const sameUsernameError = 'this username already exist'
const confirmPasswordError = 'Your confirm Password must be equal to your password'

const usernameValidate = body("username")
    .trim()
    .isAlphanumeric()
    .withMessage("Your username must be alphanumeric")
    .isLength({ min: 3 })
    .withMessage("Your username must overflow 3 characters")
    .custom(async (value, { req }) => {
        const username = await prisma.user.findUnique({
            where: {
                username: value,
            },
        });
        if (username) {
            throw new Error(sameUsernameError);
        }
    })
    .withMessage(sameUsernameError);
const passwordValidation = body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Your password must overflow 8 characters")
    .matches(/\d+/g)
    .withMessage("your password must contains at least one number")
    .matches(/[A-Z]+/g)
    .withMessage("your password must contains at least one Upper-case")
    .matches(/[a-z]+/g)
    .withMessage("your password must contains at least one Lower-case")
    .matches(/\W+/g)
    .withMessage(
        "your password must contains at least one non-alphanumeric character",
    );
const confirmPasswordValidation = body('confirmPassword')
    .trim()
    .custom((value, {req}) => {
        if(value !== req.body.password) {
            throw new Error(confirmPasswordError)
        }
        return true
    }).withMessage(confirmPasswordError)


async function signupController(req, res) {
    const result = validationResult(req)
    console.log('req:', req.body)
    const errors = result.errors
    console.log('result.array:', result.array())
    console.log('errors:', errors)

    console.log('!errors.isEmpty:', !errors.isEmpty)
    if (!result.isEmpty()) {
        return res.json({msg: errors.map(error => error.msg)})
    }
    const {username, password} = matchedData(req)
    const hashedPassword = bcrypt.hashSync(password, 10)
    const user = await prisma.user.create({
        data: {
            username,
            password: hashedPassword
        }
    })
    return res.json({user})
}

module.exports = [passwordValidation, usernameValidate, confirmPasswordValidation, signupController]