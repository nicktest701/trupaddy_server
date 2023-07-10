/**
 * @type {Knex}
 */
const router = require('express').Router();
const expressAsyncHandler = require('express-async-handler');
const { randomUUID } = require('crypto');
const _ = require('lodash');
const knex = require('../config/knex');
const verifyJWT = require('../middleware/verifyJWT');

router.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const comments = await knex('comments').orderBy('created_at', 'desc');
    res.status(200).json(comments);
  })
);

//GET Number of Comments and Likes
router.get(
  '/count/:postId',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    const { postId } = req.params;

    const likes = await knex('likes').where('post_id', postId).count();
    const comments = await knex('comments').where('post_id', postId).count();
  
    const commentsCount = comments[0]['count(*)'];

    const count = {
      likes: likesCount,
      comments: commentsCount,
    };

    res.status(200).json(count);
  })
);

//GET Number of Comments and Likes
router.get(
  '/:postId',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    const { postId } = req.params;

    // const likes = await knex('likes').where('post_id', postId);
    const stringifyComments = await knex('comments').where('post_id', postId);

    const comments = stringifyComments.map(({ content }) => {
      const comment = JSON.parse(content);

      const decodedText = decodeURIComponent(comment.text);

      const modifiedComment = {
        ...comment,
        text: decodedText,
      };
      return modifiedComment;
    });


    res.status(200).json(_.orderBy(comments, 'createdAt', 'desc'));
  })
);
// router.get(
//   '/:id',
//   expressAsyncHandler(async (req, res) => {
//     const comment_id = req.params.id;
//     const comment = await knex('comments').where('id', comment_id);
//     res.status(200).json(comment[0]);
//   })
// );

// router.get(
//   '/:postId/:userId',
//   expressAsyncHandler(async (req, res) => {
//     const { userId, postId } = req.params;
//     const comment_id = req.params.id;
//     const comment = await knex('comments').where('id', comment_id);
//     res.status(200).json(comment[0]);
//   })
// );

router.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    req.body.id = randomUUID();
    const comment = await knex('comments').insert(req.body);
   

    if (comment[0] !== 0) {
      return res.status(400).json('Error saving comment!');
    }

    //Extract your from comment
    const { user, text } = JSON.parse(req.body.content);

    //Check if you commented on your post
    const isUser = req.body.user_id === user?._id ? 'You' : user?.name;

    //Add notifications
    const noticationBody = {
      id: randomUUID(),
      user_id: req.body.user_id,
      type: JSON.stringify({
        name: 'post-comment',
        post_id: req.body.post_id,
        friend_name: user?.name,
        friend_avatar: user?.avatar,
        // text,
      }),
      message: `${isUser} commented on your post`,
    };

    await knex('notifications').insert(noticationBody);

    res.status(201).json('Comment Created!');
  })
);

router.put(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedComment = await knex('comments')
      .where({ id })
      .update(req.body);

    if (modifiedComment === 0) {
      return res.status(400).json('Couldnt update the specified comment!');
    }

    res.status(201).json('Changes saved!');
  })
);

router.patch(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedComment = await knex('comments')
      .where({ id })
      .update(req.body);

    if (modifiedComment === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified comment.Try again later');
    }

    res.status(201).json('Changes saved!');
  })
);

router.delete(
  '/',
  expressAsyncHandler(async (req, res) => {
    const id = req.query.id;
    const deletedComment = await knex('comments').where({ id }).del();

    if (deletedComment === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified comment.Try again later');
    }

    res.status(201).json('Comment removed!');
  })
);

module.exports = router;
