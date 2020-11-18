var mongoose = require("mongoose")
var validator = require("validator")
var bcrypt = require("bcryptjs")
var jwt = require("jsonwebtoken")
var Task = require("./task")

var userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw ("Invalid Email")
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0) {
                throw ("Age must be a positive number")
            } 
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if(value.toLowerCase().includes("password")) {
                throw ('Password cannot contain "password"')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.getPublicProfile = async function () {
    var user = this
    var userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    var user = this
    var token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    var user = await User.findOne({ email })
    if (!user) {
        throw new Error('Unable to Login')
    }
    var isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to Login')
    }
    return user
}

userSchema.pre('save', async function (next) {
    var user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

userSchema.pre('remove', async function (next) {
    var user = this
    await Task.deleteMany({ owner: user._id })
    next()
})

var User = mongoose.model('User', userSchema)

module.exports = User