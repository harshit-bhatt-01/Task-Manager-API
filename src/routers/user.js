var express = require("express")
var router = new express.Router()

var multer = require("multer")
var sharp  = require("sharp")

var { sendWelcomeEmail, sendCancellationEmail } = require("../emails/account")

var User = require("../models/user")
var auth = require("../middleware/auth")

router.post('/users', async (req, res) => {
    var user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        var token = await user.generateAuthToken()
        res.status(201).send({user: await user.getPublicProfile(), token})
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        var user = await User.findByCredentials(req.body.email, req.body.password)
        var token = await user.generateAuthToken()
        res.send({user: await user.getPublicProfile(), token})
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(await req.user.getPublicProfile())
})

router.patch('/users/me', auth, async (req, res) => {
    var updates = Object.keys(req.body)
    var allowedUpdates = ["name", "email", "password", "age"]
    var isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({error: "Invalid Updates"})
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()

        res.send(await req.user.getPublicProfile())
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancellationEmail(req.user.email, req.user.name)
        res.send(await req.user.getPublicProfile())
    } catch (e) {
        res.status(500).send(e)
    }
})


var upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error ('Please upload a valid image file.'))
        }
        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    var buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        var user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router