const nodemailer = require('nodemailer');

const sendEMail = async (email_address, message) => {
  try {
    const transportMail = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_CLIENT_USER,
        pass: process.env.MAIL_CLIENT_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_CLIENT_USER,
      to: [email_address],
      subject: 'FrebbyTech Consults',
      text: '',
      html: message,
    };

    const mailResult = await transportMail.sendMail(mailOptions);
    return mailResult;
  } catch (error) {
    console.log(error);
    throw error.message;
  }
};

module.exports = sendEMail;
