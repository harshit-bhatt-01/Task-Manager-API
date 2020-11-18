var express = require("express")
var app = express()
require('dotenv').config()

var userRouter = require("./routers/user")
var taskRouter = require("./routers/task")

require('./db/mongoose')

var port = process.env.PORT

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
    console.log("Server up on port:", port)
})