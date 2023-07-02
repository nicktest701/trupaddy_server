const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
  const token = req.cookies.user_;

  if (!token) {
    return res
      .status(403)
      .json('Unauthorized Access.Please contact administrator');
  }

  jwt.verify(token, process.env.JWT_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(404).json('Session has expired.Please login again');
    }

    const selectedUser = {
      _id: user?.id,
    };
    req.user = selectedUser;

    next();
  });
};

module.exports = verifyJWT;
