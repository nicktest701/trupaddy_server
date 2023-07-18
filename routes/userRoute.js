/**
 * @type {Knex}
 */
const router = require('express').Router();
const expressAsyncHandler = require('express-async-handler');
const knex = require('../config/knex');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { otpGen } = require('otp-gen-agent');

const verifyJWT = require('../middleware/verifyJWT');
const sendEMail = require('../config/sendEmail');
const {
  emailVerificationText,
  forgotPasswordText,
} = require('../config/mailText');
router.get(
  '/',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    const users = await knex('users').orderBy('users.created_at', 'desc');

    res.json(users);
  })
);

router.get(
  '/search',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    const name = req.query.name;
    const users = await knex('users')
      .whereILike('full_name', `%${name}%`)
      .select(' id as _id', 'full_name as name', 'profile_image as avatar');

    res.status(200).json(users);
  })
);

router.get(
  '/info',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    const id = req.query.id;

    const posts = await knex('posts')
      .select('*')
      .join('users', 'posts.user_id', '=', 'users.id')
      .where('posts.user_id', id);

    const friends = await knex.raw(
      `SELECT
        id as id,full_name as name,profile_image as avatar
        
  FROM
      users
  WHERE
      id IN (
      SELECT
          friendships.friend_id AS id
      FROM
          friendships
      JOIN users ON friendships.user_id = users.id
      WHERE
          friendships.user_id = ? and friendships.STATUS='accepted'
      UNION
  SELECT
      friendships.user_id AS id
  FROM
      friendships
  JOIN users ON friendships.friend_id = users.id
  WHERE
      friendships.friend_id = ? and friendships.STATUS='accepted');`,
      [id, id]
    );

    const followers = await knex('followers')
      .join('users', 'followers.follower_id', '=', 'users.id')
      .where('followers.user_id', id);

    const info = {
      posts: posts.length,
      friends: friends[0].length,
      followers: followers.length,
    };

    res.status(200).json(info);
  })
);

router.get(
  '/photos/:id',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    const userId = req.params.id;
    const photos = await knex('photos')
      .select('id', 'uri', 'created_at')
      .where('user_id', userId)
      .orderBy('created_at', 'desc');

    res.json(photos);
  })
);
router.get(
  '/:userId',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const user = await knex('users')
      .select(
        'id as _id',
        'profile_image as avatar',
        'full_name as name',
        'username',
        'date_of_birth as dob',
        'gender',
        'email',
        'bio as biography'
      )
      .where('id', userId)
      .limit(1);

    res.json(user[0]);
  })
);

router.post(
  '/profile',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    const userId = req.user?._id;

    const user = await knex('users')
      .select(
        'id as _id',
        'profile_image as avatar',
        'full_name as name',
        'username',
        'date_of_birth as dob',
        'gender',
        'email',
        'bio as biography'
      )
      .where('id', userId);

    res.status(200).json(user[0]);
  })
);

router.post(
  '/login',
  expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await knex('users')
      .select(
        'id as _id',
        'profile_image as avatar',
        'full_name as name',
        'username',
        'date_of_birth as dob',
        'gender',
        'email',
        'bio as biography',
        'password'
      )
      .where('email', email);

    if (_.isEmpty(user[0])) {
      return res.status(404).json('Invalid Username or Password');
    }

    const isTrue = await bcrypt.compare(password, user[0].password);

    if (!isTrue) {
      return res.status(404).json('Invalid Username or Password');
    }

    const current_user = {
      _id: user[0]._id,
      name: user[0].name,
      email: user[0].email,
      username: user[0].username,
      avatar: user[0].avatar,
      dob: user[0].dob,
      biography: user[0].biography,
      gender: user[0].gender,
    };

    const token = jwt.sign({ id: user[0]._id }, process.env.JWT_TOKEN_SECRET, {
      expiresIn: '30d',
    });

    res.cookie('user_', token, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
    });
    req.user = current_user;

    res.status(200).json(current_user);
  })
);

router.post(
  '/verify-otp',
  expressAsyncHandler(async (req, res) => {
    const { code, email } = req.body;

    const isUserExists = await knex('users').where({ email });
    if (!_.isEmpty(isUserExists)) {
      return res.status(400).json('An account with this email already exists!');
    }

    if (!code) {
      return res.status(403).json('Invalid code');
    }

    const user = await knex('otps')
      .where({ email })
      .select('email', 'code')
      .orderBy('created_at', 'desc')
      .limit(1);
    if (_.isEmpty(user)) {
      return res.status(404).json('Invalid code');
    }

    jwt.verify(
      user[0].code,
      process.env.OTP_TOKEN_SECRET,
      (err, selectedUser) => {
        if (err) {
          return res.status(404).json('Code is invalid.');
        }

        if (code !== selectedUser.code) {
          return res.status(404).json('Code is invalid.');
        }

        res.sendStatus(200);
      }
    );
  })
);

router.post(
  '/verify-email',
  expressAsyncHandler(async (req, res) => {
    const { name, email } = req.body;

    const isUserExists = await knex('users').where({ email });
    if (!_.isEmpty(isUserExists)) {
      return res.status(400).json('An account with this email already exists!');
    }

    const code = await otpGen();

    const results = await sendEMail(
      email,
      emailVerificationText({ name, code })
    );

    if (!results.messageId) {
      return res.status(400).json('Error sending request!');
    }

    //Generate OTP token
    const token = jwt.sign({ email, code }, process.env.OTP_TOKEN_SECRET, {
      expiresIn: '30m',
    });

    const opt = {
      id: randomUUID(),
      email,
      code: token,
    };

    ///Save user info and OTP token
    await knex('otps').insert(opt);

    res.sendStatus(200);
  })
);

router.put(
  '/forgot-password',
  expressAsyncHandler(async (req, res) => {
    const { email } = req.body;

    const isUserExists = await knex('users')
      .where({ email })
      .limit(1)
      .select('email');

    if (isUserExists.length === 0) {
      return res
        .status(400)
        .json('Sorry We couldnt find an account with this email!');
    }

    const code = await otpGen();

    const results = await sendEMail(email, forgotPasswordText(code));

    if (!results.messageId) {
      return res.status(400).json('Error sending request!');
    }

    //Generate OTP token
    const token = jwt.sign(
      { email, token: code },
      process.env.OTP_TOKEN_SECRET,
      {
        expiresIn: '30m',
      }
    );

    const opt = {
      id: randomUUID(),
      email,
      token,
    };

    ///Save user info and OTP token
    await knex('reset_otps').insert(opt);

    res.sendStatus(200);
  })
);

router.put(
  '/reset-otp',
  expressAsyncHandler(async (req, res) => {
    const { token, email } = req.body;

    if (!token || !email) {
      return res
        .status(400)
        .json('Error validating your token.Request for a new one!');
    }

    if (!token) {
      return res.status(403).json('Invalid token');
    }

    const user = await knex('reset_otps')
      .where({ email })
      .select('email', 'token')
      .orderBy('created_at', 'desc')
      .limit(1);
    if (_.isEmpty(user)) {
      return res.status(404).json('Invalid token');
    }

    jwt.verify(
      user[0].token,
      process.env.OTP_TOKEN_SECRET,
      (err, selectedUser) => {
        if (err) {
          return res.status(404).json('Token has expired!.');
        }

        if (token !== selectedUser.token) {
          return res.status(404).json('Token is invalid.');
        }

        res.sendStatus(200);
      }
    );
  })
);

router.put(
  '/reset-password',
  expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      return res
        .status(400)
        .json('Error resetting  your password.Try again later');
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;

    await knex('users')
      .update({ password: hashedPassword })
      .where('email', email);

    res.status(200).json('Password updated successfully!');
  })
);

router.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const isUserExists = await knex('users').where({ email });
    if (!_.isEmpty(isUserExists)) {
      return res.status(400).json('An account with this email already exists!');
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.id = randomUUID();
    req.body.password = hashedPassword;

    await knex('users').insert(req.body);
    res.sendStatus(200);
  })
);

router.post(
  '/photos',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { photos } = req.body;

    const modifiedPhotos = photos?.map((photo) => {
      return {
        id: randomUUID(),
        uri: photo,
        user_id: userId,
      };
    });

    const uploadedPhotos = await knex('photos').insert(modifiedPhotos);

    if (uploadedPhotos[0] !== 0) {
      return res.status(400).json('Error saving photos!');
    }

    res.status(200).send('Photos Updated');
  })
);

router.post(
  '/logout',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    res.cookie('user_', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json('ok');
  })
);

router.put(
  '/',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedUser = await knex('users').where({ id }).update(req.body);

    res.json(modifiedUser);
  })
);

router.patch(
  '/',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedUser = await knex('users').where({ id }).update(req.body);

    res.status(201).json(modifiedUser);
  })
);

router.delete(
  '/',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    const id = req.query.id;
    const user = await knex('users').where({ id }).del();
    res.json(user);
  })
);

module.exports = router;
