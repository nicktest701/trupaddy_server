// /**
//  * @type {Knex}
//  */
const router = require('express').Router();
const expressAsyncHandler = require('express-async-handler');
const { randomUUID } = require('crypto');
const _ = require('lodash');
const knex = require('../config/knex');
const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT);

router.get(
  '/all',
  expressAsyncHandler(async (req, res) => {
    const post_id = req.query.post_id;
    console.log(post_id);
    const likes = await knex('likes')
      .join('users', 'likes.user_id', '=', 'users.id')
      .where('likes.post_id', post_id)
      .select(
        'users.id as user_id',
        'users.full_name as name',
        'users.profile_image as avatar',
        'likes.created_at'
      )
      .orderBy('likes.created_at', 'asc');
    // console.log(likes);
    res.status(200).json(likes);
  })
);

/// Get user like
router.get(
  '/post/:id',
  expressAsyncHandler(async (req, res) => {
    const post_id = req.params.id;
    const user_id = req.user._id;
    const like = await knex('likes').where({
      post_id,
      user_id,
    });

    const isLiked = _.isEmpty(like) ? false : true;
    res.status(200).json(isLiked);
  })
);

router.get(
  '/user/:id',
  expressAsyncHandler(async (req, res) => {
    const like_id = req.params.id;
    const like = await knex('likes').where('id', like_id);
    res.status(200).json(like[0]);
  })
);

router.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { user_id, post_id, postee, name, avatar } = req.body;
    const newLike = {
      id: randomUUID(),
      user_id,
      post_id,
    };
    const like = await knex('likes').insert(newLike);

    if (like[0] !== 0) {
      return res.status(400).json('Error saving like!');
    }

    //Notifications
    const noticationBody = {
      id: randomUUID(),
      user_id: postee,
      type: JSON.stringify({
        name: 'post-like',
        post_id,
        friend_name: name,
        friend_avatar: avatar,
      }),
      message: `${name} liked your post`,
    };

    await knex('notifications').insert(noticationBody);

    res.status(201).json('Like Created!');
  })
);

router.put(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedLike = await knex('likes').where({ id }).update(req.body);

    if (modifiedLike === 0) {
      return res.status(400).json('Couldnt update the specified like!');
    }

    res.status(201).json('Changes saved!');
  })
);

router.patch(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedLike = await knex('likes').where({ id }).update(req.body);

    if (modifiedLike === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified like.Try again later');
    }

    res.status(201).json('Changes saved!');
  })
);

router.delete(
  '/',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    const { post_id, user_id } = req.query;
    const deletedLike = await knex('likes')
      .where({
        post_id,
        user_id,
      })
      .del();

    if (deletedLike === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified like.Try again later');
    }

    res.status(201).json('Like removed!');
  })
);

module.exports = router;
