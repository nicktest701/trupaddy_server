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
const mailText = require('../config/mailText');
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
    // console.log(users);
    res.status(200).json(users);
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

    const results = await sendEMail(email, mailText({ name, code }));
    // console.log(results);

    if (!results.messageId) {
      res.status(400).json('Error sending request!');
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
  '/logout',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    res.cookie('user_', '', {
      httpOnly: true,
      expires: new Date(0),
    });
    console.log('end');

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
    console.log(modifiedUser);

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
