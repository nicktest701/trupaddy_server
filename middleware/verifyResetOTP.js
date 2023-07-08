const jwt = require('jsonwebtoken');
const knex = require('../config/knex');

const verifyResetOTP = async (req, res, next) => {
  const { token, email } = req.body;

  if (!token) {
    return res
      .status(403)
      .json('Unauthorized Access.Please contact administrator');
  }

  const user = await knex('otps').where({ token }).select('email', 'token');
  if (_.isEmpty(user)) {
    res.status(404).json('Invalid Token');
  }

  jwt.verify(user.token, process.env.OTP_TOKEN_SECRET, (err, token) => {
    if (err) {
      return res.status(404).json('Invalid Token');
    }
  });

  next();
};

module.exports = verifyResetOTP;
