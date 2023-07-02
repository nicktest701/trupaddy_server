const jwt = require('jsonwebtoken');
const knex = require('../config/knex');

const verifyOTP = async (req, res, next) => {
  const { code, email } = req.body;

  if (!code) {
    return res
      .status(403)
      .json('Unauthorized Access.Please contact administrator');
  }

  const user = await knex('otps').where({ code }).select('email', 'token');
  if (_.isEmpty(user)) {
    res.status(404).json('Invalid Token');
  }

  jwt.verify(user.token, process.env.OTP_TOKEN_SECRET, (err, code) => {
    if (err) {
      return res.status(404).json('Invalid Token');
    }
  });

  next();
};

module.exports = verifyOTP;
