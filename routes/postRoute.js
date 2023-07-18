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
      .select('user_id', 'friend_id')
      .where('user_id', userId)
      .orWhere('friend_id', userId);
    const ids = friends.flatMap(({ user_id, friend_id }) => [
      user_id,
      friend_id,
    ]);

    const friends_ids = [...ids, userId];

    //Get all post by friends id
    const posts = await knex('posts')
      .join('users', 'posts.user_id', '=', 'users.id')
      .whereIn('posts.user_id', friends_ids)
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

    const query = `
    SELECT
    shares.id AS id,
    sharer.id AS sharer_id,
    sharer.full_name AS sharer_name,
    sharer.profile_image AS sharer_avatar,
    shares.created_at AS post_shared_at,
    postee.id AS poster_id,
    postee.full_name AS poster_name,
    postee.profile_image AS poster_avatar,
    posts.id AS post_id,
    posts.user_id AS postee,
    posts.content AS post_content,
    posts.created_at post_created_at
FROM
    shares
JOIN users sharer ON
    shares.sharer_id = sharer.id
JOIN users postee ON
    shares.postee_id = postee.id
JOIN posts ON shares.post_id = posts.id
WHERE
    shares.sharer_id IN (${friends_ids.map(() => '?').join(', ')});
    `;
    const shares = await knex.raw(query, friends_ids);

    if (_.isEmpty(shares)) {
      return res.status(200).json([]);
    }

    const modifiedShares = shares[0].map((item) => {
      const sharedItem = _.toPlainObject(item);

      const sharedPost = {
        id: sharedItem?.id,
        sharer_id: sharedItem?.sharer_id,
        created_at: sharedItem?.post_shared_at,
        sharer: {
          id: sharedItem?.sharer_id,
          name: sharedItem?.sharer_name,
          avatar: sharedItem?.sharer_avatar,
          created_at: sharedItem?.post_shared_at,
        },

        post: {
          id: sharedItem?.post_id,
          _id: sharedItem?.postee,
          name: sharedItem?.poster_name,
          avatar: sharedItem?.poster_avatar,
          content: sharedItem?.post_content,
          created_at: sharedItem?.post_created_at,
        },
      };

      return sharedPost;
    });

    const mergedPostAndShares = _.orderBy(
      _.union(posts, modifiedShares),
      'created_at',
      'desc'
    );

    res.status(200).json(mergedPostAndShares);
  })
);

router.get(
  '/info',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.query;
    const likes = await knex('likes')
      .join('users', 'likes.user_id', '=', 'users.id')
      .where('likes.post_id', id);

    const comments = await knex('comments').where('post_id', id);
    const shares = await knex.raw(
      `
    SELECT
    sharer.id AS sharer_id,
    sharer.full_name AS sharer_name,
    sharer.profile_image AS sharer_avatar,
    shares.created_at AS post_shared_at,
    postee.id AS poster_id,
    postee.full_name AS poster_name,
    postee.profile_image AS poster_avatar,
    posts.id AS post_id,
    posts.content AS post_content,
    posts.created_at post_created_at
FROM
    shares
JOIN users sharer ON
    shares.sharer_id = sharer.id
JOIN users postee ON
    shares.sharer_id = postee.id
JOIN posts ON shares.post_id = posts.id
WHERE
    shares.post_id = ?;
    `,
      [id]
    );

    const postInfo = {
      likes: likes.length,
      comments: comments.length,
      shares: shares[0].length,
    };
    console.log(postInfo);

    res.status(200).json(postInfo);
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
