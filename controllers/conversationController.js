
function conversationController(req, res) {
    console.log('req.user:', req.user)
    res.json({user: req.user})
}

module.exports = conversationController