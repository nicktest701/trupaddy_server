const nodemailer = require('nodemailer');

const sendEMail = async (email_address, message) => {
  try {
    const customTransportMail = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'trupaddy160@gmail.com',
        pass: 'ewpoqowdbdtmsjob',
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from:'support@truppady.com',
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
