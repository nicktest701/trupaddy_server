/**
 * @type {Knex}
 */
const router = require('express').Router();
const expressAsyncHandler = require('express-async-handler');
const _ = require('lodash');
const knex = require('../config/knex');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT);



//@ GET all accepted followers by user id
router.get(
  '/',

  expressAsyncHandler(async (req, res) => {
    const userId = req.query.user_id;
    const followers = await knex('followers')
      .join('users', 'followers.follower_id', '=', 'users.id')
      .where('followers.user_id', userId)
      .select(
        'followers.user_id as _id',
        'followers.follower_id as follower_id',
        'users.full_name as name',
        'users.profile_image as avatar',
        'users.created_at'
      )
      .orderBy('users.created_at', 'desc');

    res.status(200).json(followers);
  })
);

//@ POST Add new followers

router.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    const follower = await knex('followers').insert(req.body);

    if (follower[0] !== 0) {
      return res.status(400).json('Error saving follower!');
    }

    res.status(201).json('Follower Created!');
  })
);

//@ PATCH update follower status ,[pending,accepted,rejected]
router.patch(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { user_id, follower_id } = req.body;
    const modifiedFollower = await knex('followers')
      .where({ user_id, follower_id })
      .update(req.body);

    if (modifiedFollower === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified follower.Try again later');
    }

    res.status(201).json('Changes saved!');
  })
);

router.delete(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { user_id, follower_id } = req.query;
    const deletedFollower = await knex('followers')
      .where({ user_id, follower_id })
      .del();

    if (deletedFollower === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified follower.Try again later');
    }

    res.status(201).json('Follower removed!');
  })
);

module.exports = router;
