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
    const group_posts = await knex('group_posts').orderBy('created_at', 'desc');
    res.status(200).json(group_posts);
  })
);


router.get(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    const group_post_id = req.params.id;
    const group_post = await knex('group_posts').where('id', group_post_id);
    res.status(200).json(group_post[0]);
  })
);

router.group_post(
  '/',
  expressAsyncHandler(async (req, res) => {
    req.body.id = randomUUID();
    const group_post = await knex('group_posts').insert(req.body);
    console.log(group_post[0]);
    if (group_post[0] !== 0) {
      return res.status(400).json('Error saving group_post!');
    }

    res.status(201).json('Group_post Created!');
  })
);

router.put(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedGroup_post = await knex('group_posts').where({ id }).update(req.body);

    if (modifiedGroup_post === 0) {
      return res.status(400).json('Couldnt update the specified group_post!');
    }

    res.status(201).json('Changes saved!');
  })
);

router.patch(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedGroup_post = await knex('group_posts').where({ id }).update(req.body);

    if (modifiedGroup_post === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified group_post.Try again later');
    }

    res.status(201).json('Changes saved!');
  })
);

router.delete(
  '/',
  expressAsyncHandler(async (req, res) => {
    const id = req.query.id;
    const deletedGroup_post = await knex('group_posts').where({ id }).del();

    if (deletedGroup_post === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified group_post.Try again later');
    }

    res.status(201).json('Group_post removed!');
  })
);

module.exports = router;
