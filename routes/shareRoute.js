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
  '/',
  expressAsyncHandler(async (req, res) => {
    const shares = await knex.raw(
      `
    SELECT
    sharer.id AS sharer_id,
    sharer.full_name AS sharer_name,
    sharer.profile_image AS sharer_avatar,
    shares.id,
    shares.created_at AS post_shared_at,
    postee.id AS poster_id,
    postee.full_name AS poster_name,
    postee.profile_image AS poster_avatar,
    posts.id AS post_id,
    posts.content AS post_content,
    posts.bgColor AS bgColor,
    posts.created_at post_created_at
FROM
    shares
JOIN users sharer ON
    shares.sharer_id = sharer.id
JOIN users postee ON
    shares.sharer_id = postee.id
JOIN posts ON shares.post_id = posts.id `
    );

    if (_.isEmpty(shares)) {
      return res.status(200).json({});
    }
    const sharedItem = await _.toPlainObject(shares[0][0]);

    const sharer = {
      share_post_id: id,
      id: sharedItem?.sharer_id,
      name: sharedItem?.sharer_name,
      avatar: sharedItem?.sharer_avatar,
      created_at: sharedItem?.post_shared_at,
    };

    const post = {
      id: sharedItem?.post_id,
      name: sharedItem?.poster_name,
      avatar: sharedItem?.poster_avatar,
      content: sharedItem?.post_content,
      bgColor: sharedItem?.bgColor,
      created_at: sharedItem?.post_created_at,
    };
    console.log(post);

    res.status(200).json({ sharer, post });
  })
);

router.get(
  '/post/:id',
  expressAsyncHandler(async (req, res) => {
    const post_id = req.params.id;

    const shares = await knex.raw(
      `
    SELECT
    sharer.id AS sharer_id,
    sharer.full_name AS sharer_name,
    sharer.profile_image AS sharer_avatar,
    shares.id,
    shares.created_at AS post_shared_at,
    postee.id AS poster_id,
    postee.full_name AS poster_name,
    postee.profile_image AS poster_avatar,
    posts.id AS post_id,
    posts.content AS post_content,
    posts.bgColor AS bgColor,
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
      [post_id]
    );

    if (_.isEmpty(shares)) {
      return res.status(200).json([]);
    }

    const modifiedShares = shares[0].map((item) => {
      const sharedItem = _.toPlainObject(item);

      const sharer = {
        share_post_id: id,
        id: sharedItem?.sharer_id,
        name: sharedItem?.sharer_name,
        avatar: sharedItem?.sharer_avatar,
        created_at: sharedItem?.post_shared_at,
      };

      const post = {
        id: sharedItem?.post_id,
        name: sharedItem?.poster_name,
        avatar: sharedItem?.poster_avatar,
        content: sharedItem?.post_content,
        bgColor: sharedItem?.bgColor,
        created_at: sharedItem?.post_created_at,
      };
      console.log(post);
      return { sharer, post };
    });

    res.status(200).json(modifiedShares);
  })
);

router.get(
  '/user/:id',
  expressAsyncHandler(async (req, res) => {
    const user_id = req.query.id;

    const shares = await knex.raw(
      `
    SELECT
    sharer.id AS sharer_id,
    sharer.full_name AS sharer_name,
    sharer.profile_image AS sharer_avatar,
    shares.id,
    shares.created_at AS post_shared_at,
    postee.id AS poster_id,
    postee.full_name AS poster_name,
    postee.profile_image AS poster_avatar,
    posts.id AS post_id,
    posts.content AS post_content,
    posts.bgColor AS bgColor,
    posts.created_at post_created_at
FROM
    shares
JOIN users sharer ON
    shares.sharer_id = sharer.id
JOIN users postee ON
    shares.sharer_id = postee.id
JOIN posts ON shares.post_id = posts.id
WHERE
    shares.sharer_id = ?;
    `,
      [user_id]
    );

    if (_.isEmpty(shares)) {
      return res.status(200).json([]);
    }

    const modifiedShares = shares[0].map((item) => {
      const sharedItem = _.toPlainObject(item);

      const sharer = {
        share_post_id: id,
        id: sharedItem?.sharer_id,
        name: sharedItem?.sharer_name,
        avatar: sharedItem?.sharer_avatar,
        created_at: sharedItem?.post_shared_at,
      };

      const post = {
        id: sharedItem?.post_id,
        name: sharedItem?.poster_name,
        avatar: sharedItem?.poster_avatar,
        content: sharedItem?.post_content,
        bgColor: sharedItem?.bgColor,
        created_at: sharedItem?.post_created_at,
      };

      console.log(post);

      return { sharer, post };
    });

    res.status(200).json(modifiedShares);
  })
);

router.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { sharer_id, name, avatar, postee, post_id } = req.body;

    const ifExists = await knex('shares').where({
      sharer_id,
      post_id,
    });

    if (!_.isEmpty(ifExists)) {
      return res.status(400).json("You've already shared this post!");
    }
    const newShare = {
      id: randomUUID(),
      sharer_id,
      post_id,
      postee_id: postee,
    };
    const share = await knex('shares').insert(newShare);

    if (share[0] !== 0) {
      return res.status(400).json('Error saving share!');
    }

    //Notifications
    const noticationBody = {
      id: randomUUID(),
      user_id: postee,
      type: JSON.stringify({
        name: 'post-share',
        post_id,
        friend_name: name,
        friend_avatar: avatar,
      }),
      message:
        sharer_id === postee
          ? 'You shared your own post'
          : `${name} shared your post`,
    };

    await knex('notifications').insert(noticationBody);

    res.status(201).json('Post Shared!');
  })
);

router.put(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedShare = await knex('shares').where({ id }).update(req.body);

    if (modifiedShare === 0) {
      return res.status(400).json('Couldnt update the specified share!');
    }

    res.status(201).json('Changes saved!');
  })
);

router.patch(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedShare = await knex('shares').where({ id }).update(req.body);

    if (modifiedShare === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified share.Try again later');
    }

    res.status(201).json('Changes saved!');
  })
);

router.delete(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.query;
    const deletedShare = await knex('shares').where({ id }).del();

    if (deletedShare === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified share.Try again later');
    }

    res.status(201).json('Post removed!');
  })
);

module.exports = router;
