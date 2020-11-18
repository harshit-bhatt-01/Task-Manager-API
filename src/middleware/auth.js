var jwt = require("jsonwebtoken")
var User = require("../models/user")

var auth = async (req, res, next) => {
    try {
        var token = req.header('Authorization').replace('Bearer ', '')
        var decoded = jwt.verify(token, 'thisismyauthentication')
        var user = await User.findOne({_id: decoded._id, 'tokens.token': token})

        if(!user) {
            throw new Error()
        }
        req.token = token
        req.user = user
        next()
    } catch (e) {
        res.status(401).send({ error: "Please Authenticate" })
    }
}

module.exports = auth