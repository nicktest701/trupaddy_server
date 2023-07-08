const nodemailer = require('nodemailer');

const sendEMail = async (email_address, message) => {
  try {
    const customTransportMail = nodemailer.createTransport({
      service: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_CLIENT_USER,
        pass: process.env.MAIL_CLIENT_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_SENDER,
      to: [email_address],
      subject: 'Trupaddy',
      text: '',
      html: message,
    };

    const mailResult = await customTransportMail.sendMail(mailOptions);
    return mailResult;
  } catch (error) {
    console.log(error);
    throw error.message;
  }
};

module.exports = sendEMail;
