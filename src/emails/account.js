var sgMail = require("@sendgrid/mail")
var sendGridAPIKey = process.env.SENDGRID_API_KEY

sgMail.setApiKey(sendGridAPIKey)

var sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'harshitbhatt0007@gmail.com',
        subject: 'Thanks for joining in!',
        text: 'Welcome to the app, '+ name +'. Let me know how you get along with the app.'
    })
}

var sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'harshitbhatt0007@gmail.com',
        subject: 'Thanks for using our service!',
        text: 'Hey, '+ name +'. Is there something else we could have done to make you stay connected.'
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}