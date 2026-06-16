require('dotenv').config()
const passport = require('passport');
const { prisma } = require('../lib/prisma');

const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt

const opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET_KEY;

module.exports = new JwtStrategy(opts, async function(jwt_payload, done) {
    console.log('jwt_payload:', jwt_payload)
    const user = await prisma.user.findUnique({
        where: {
            id: jwt_payload.user.id
        },
        omit: {
            password: true
        }
    })

    if(!user) return done(null, user)
    return done(null, user)
})
