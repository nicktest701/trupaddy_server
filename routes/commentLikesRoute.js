/**
 * @type {Knex}
 */
const router = require('express').Router();
const expressAsyncHandler = require('express-async-handler');
const { randomUUID } = require('crypto');
const _ = require('lodash');
const knex = require('../config/knex');


router.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const comment_likes = await knex('comment_likes').orderBy('created_at', 'desc');
    res.status(200).json(comment_likes);
  })
);


router.get(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    const comment_id = req.params.id;
    const comment = await knex('comment_likes').where('id', comment_id);
    res.status(200).json(comment[0]);
  })
);

router.comment(
  '/',
  expressAsyncHandler(async (req, res) => {
    req.body.id = randomUUID();
    const comment = await knex('comment_likes').insert(req.body);
    console.log(comment[0]);
    if (comment[0] !== 0) {
      return res.status(400).json('Error saving comment!');
    }

    res.status(201).json('Comment Created!');
  })
);

router.put(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedComment = await knex('comment_likes').where({ id }).update(req.body);

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
    const modifiedComment = await knex('comment_likes').where({ id }).update(req.body);

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
    const deletedComment = await knex('comment_likes').where({ id }).del();

    if (deletedComment === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified comment.Try again later');
    }

    res.status(201).json('Comment removed!');
  })
);

module.exports = router;
