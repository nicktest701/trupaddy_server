/**
 * @type {Knex}
 */
const router = require('express').Router();
const expressAsyncHandler = require('express-async-handler');
const _ = require('lodash');
const { randomUUID } = require('crypto');
const knex = require('../config/knex');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT);
router.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const friendships = await knex('friendships').orderBy('created_at', 'desc');
    res.status(200).json(friendships);
  })
);

//@ GET all accepted friends
router.get(
  '/all/:userId',
  expressAsyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const friends = await knex('friendships')
      .join('users', 'friendships.friend_id', '=', 'users.id')
      .where({
        'friendships.user_id': userId,
      })
      .select(
        'friendships.user_id',
        'friendships.friend_id',
        'users.full_name',
        'users.profile_image',
        'users.created_at'
      )
      .orderBy('users.created_at', 'desc');
   
    res.status(200).json(friends);
  })
);
//@ GET all accepted friends
router.get(
  '/friends',
  expressAsyncHandler(async (req, res) => {
    // const userId = req.user._id || req.query.user_id;
    const userId = req.query.user_id;

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
      [userId, userId]
    );

    res.status(200).json(friends[0]);
  })
);
//@ GET all pending friend requests
router.get(
  '/requests',
  expressAsyncHandler(async (req, res) => {
    const userId = req.user._id;
    const friends = await knex('friendships')
      .join('users', 'friendships.user_id', '=', 'users.id')
      .where({
        'friendships.friend_id': userId,
        'friendships.status': 'pending',
      })
      .select(
        'friendships.user_id',
        'friendships.friend_id',
        'users.full_name as name',
        'users.profile_image as avatar',
        'friendships.created_at'
      )
      .orderBy('friendships.created_at', 'desc');

    res.status(200).json(friends);
  })
);

//@ GET  friendship status
router.get(
  '/status',
  expressAsyncHandler(async (req, res) => {
    const { user_id, friend_id } = req.query;

    const friendship = await knex('friendships')
      .where({ user_id, friend_id })
      .orWhere({ friend_id: user_id, user_id: friend_id });


    if (_.isEmpty(friendship)) {
      return res.status(200).json({
        status: 'not-friends',
        user_id: '',
        friend_id: '',
      });
    }

    if (friendship[0]?.status === 'accepted') {
      return res.status(200).json({
        status: 'friends-accepted',
        user_id: friendship[0].user_id,
        friend_id: friendship[0].friend_id,
      });
    } else {
      return res.status(200).json({
        status: 'friends-pending',
        user_id: friendship[0].user_id,
        friend_id: friendship[0].friend_id,
      });
    }
  })
);

router.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    const {
      request,
      notification: { name },
    } = req.body;
    const friendship = await knex('friendships').insert(request);

    if (friendship[0] !== 0) {
      return res.status(400).json('Error sending request!');
    }

    //Add Notications
    const body = {
      id: randomUUID(),
      user_id: request.friend_id,
      type: JSON.stringify({
        name: 'friend-request',
        friend_id: request.user_id,
        friend_name: name,
      }),
      message: `${name} has sent you a friend request.`,
    };
    await knex('notifications').insert(body);

    res.status(201).json('Request sent!');
  })
);

router.put(
  '/',
  expressAsyncHandler(async (req, res) => {
    const user_id = req.user._id || req.body.user_id;

    const modifiedFriendship = await knex('friendships')
      .update(req.body)
      .where({ user_id });

    if (modifiedFriendship === 0) {
      return res.status(400).json('Couldnt update the specified friendship!');
    }

    res.status(201).json('Changes saved!');
  })
);

//@ PATCH update friendship status ,[pending,accepted,rejected]
router.patch(
  '/',
  expressAsyncHandler(async (req, res) => {
    const {
      request,
      notification: { name },
    } = req.body;
    const { user_id, friend_id, status } = request;

    if (status === 'rejected') {
      const friend = await knex('friendships')
        .where({ user_id, friend_id })
        .del();
      if (friend !== 1) {
        return res
          .status(400)
          .json('Error canceling request!');
      }

      return res.status(201).json('Request Cancelled!');
    }

    const modifiedFriendship = await knex('friendships')
      .where({ user_id, friend_id })
      .update(req.body.request);

    if (modifiedFriendship === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified friendship.Try again later');
    }

    if (status === 'accepted') {
      //Add Notications
      const body = {
        id: randomUUID(),
        user_id: request.user_id,
        type: JSON.stringify({
          name: 'friend-accepted',
          friend_id: request.friend_id,
          friend_name: name,
        }),
        message: `${name} has accepted your friend request.`,
      };
      await knex('notifications').insert(body);
    }

    res.status(201).json('Changes saved!');
  })
);

router.delete(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { user_id, friend_id } = req.query;
    const deletedFriendship = await knex('friendships')
      .where({ user_id, friend_id })
      .del();

    if (deletedFriendship === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified friendship.Try again later');
    }

    res.status(201).json('Friendship removed!');
  })
);

module.exports = router;
