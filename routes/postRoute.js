/**
 * @type {Knex}
 */
const router = require('express').Router();
const expressAsyncHandler = require('express-async-handler');
const { randomUUID } = require('crypto');
const _ = require('lodash');
const knex = require('../config/knex');
const verifyJWT = require('../middleware/verifyJWT');

//@GET Get posts from friends
router.get(
  '/',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    const userId = req.user._id;

    //Select all friends from friendship list
    const friends = await knex('friendships')
      .select('friend_id')
      .where('user_id', userId);
    const ids = friends.map((friend) => friend.friend_id);

    //Get all post by friends id
    const posts = await knex('posts')
      .join('users', 'posts.user_id', '=', 'users.id')
      .whereIn('posts.user_id', [...ids, userId])
      .select(
        'posts.id as id',
        'posts.user_id as _id',
        'users.full_name as name',
        'users.profile_image as avatar',
        'posts.content',
        'posts.privacy',
        'posts.created_at'
      )
      .orderBy('posts.created_at', 'desc');

    //find if current user post is less than 20
    if (posts?.length < 20) {
      const othersPost = await knex('posts')
        .join('users', 'posts.user_id', '=', 'users.id')
        .select(
          'posts.id as id',
          'posts.user_id as _id',
          'users.full_name as name',
          'users.profile_image as avatar',
          'posts.content',
          'posts.privacy',
          'posts.created_at'
        )
        .orderBy('posts.created_at', 'desc');

      const mergedPost = _.uniq(_.merge(posts, othersPost));
      return res.status(200).json(mergedPost);
    }

    res.status(200).json(posts);
  })
);

router.get(
  '/:id/:postee',
  expressAsyncHandler(async (req, res) => {
    const { id, postee } = req.params;
    const post = await knex('posts')
      .join('users', 'posts.user_id', '=', 'users.id')
      .where({
        'posts.id': id,
        'posts.user_id': postee,
      })
      .select(
        'posts.id as id',
        'posts.user_id as _id',
        'users.full_name as name',
        'users.profile_image as avatar',
        'posts.content',
        'posts.privacy',
        'posts.created_at'
      );

   

    res.status(200).json(post[0]);
  })
);

//@GET Get posts from current_user
router.post(
  '/user/:user_id',
  expressAsyncHandler(async (req, res) => {
    const user_id = req.params.user_id;

    const posts = await knex('posts')
      .select('*')
      .join('users', 'posts.user_id', '=', 'users.id')
      .where({ user_id })
      .select(
        'posts.id as id',
        'posts.user_id as _id',
        'users.full_name as name',
        'users.profile_image as avatar',
        'posts.content',
        'posts.privacy',
        'posts.created_at'
      )
      .orderBy('posts.created_at', 'desc');

    res.status(200).json(posts);
  })
);
// //@GET Get posts from friends
// router.get(
//   '/user',
//   expressAsyncHandler(async (req, res) => {
//     const userId = req.params.userId;
//     //Select all friends from friendship list
//     const friends = await knex('friendships')
//       .select('friend_id')
//       .where('user_id', userId);

//     //Get all post by friends id
//     const posts = await knex('posts')
//       .select('*')
//       .whereIn('user_id', friends)
//       .orderBy('created_at', 'desc');

//     res.status(200).json(posts);
//   })
// );

router.post(
  '/',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    req.body.id = randomUUID();
   
    const post = await knex('posts').insert(req.body);
   
    if (post[0] !== 0) {
      return res.status(400).json('Error saving post!');
    }

    res.status(201).json('Post Created!');
  })
);

router.put(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedPost = await knex('posts').where({ id }).update(req.body);

    if (modifiedPost === 0) {
      return res.status(400).json('Couldnt update the specified post!');
    }

    res.status(201).json('Changes saved!');
  })
);

router.patch(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedPost = await knex('posts').where({ id }).update(req.body);

    if (modifiedPost === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified post.Try again later');
    }

    res.status(201).json('Changes saved!');
  })
);

router.delete(
  '/',
  expressAsyncHandler(async (req, res) => {
    const id = req.query.id;
    const deletedPost = await knex('posts').where({ id }).del();

    if (deletedPost === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified post.Try again later');
    }

    res.status(201).json('Post removed!');
  })
);

module.exports = router;
