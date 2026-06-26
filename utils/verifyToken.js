const jwt = require("jsonwebtoken")

module.exports = function verifyToken(req, res, next) {
    const headers = req.headers.authorization
    const bearer = headers.split(' ')
    const token = bearer[1]
    if(!token || token === 'null'){ 
        return res.json({user: undefined})
    }
    jwt.verify(token, process.env.SECRET_KEY, function(err, state) {
        if(err){
            console.error('err:', err.message)
            if(err.message === 'jwt expired') {
                req.user = undefined
                return next()
            }
             return next(err)
            }
        req.user = state.user
        next()
    })
}