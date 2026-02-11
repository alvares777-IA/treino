const nodemailer = require('nodemailer');

let mailTransporter;

function getMailTransporter() {
    if (!mailTransporter) {
        mailTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });
    }
    return mailTransporter;
}

module.exports = { getMailTransporter };
