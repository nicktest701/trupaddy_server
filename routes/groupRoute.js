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
    const groups = await knex('groups').orderBy('created_at', 'desc');
    res.status(200).json(groups);
  })
);


router.get(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    const group_id = req.params.id;
    const group = await knex('groups').where('id', group_id);
    res.status(200).json(group[0]);
  })
);

router.group(
  '/',
  expressAsyncHandler(async (req, res) => {
    req.body.id = randomUUID();
    const group = await knex('groups').insert(req.body);
    console.log(group[0]);
    if (group[0] !== 0) {
      return res.status(400).json('Error saving group!');
    }

    res.status(201).json('Group Created!');
  })
);

router.put(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedGroup = await knex('groups').where({ id }).update(req.body);

    if (modifiedGroup === 0) {
      return res.status(400).json('Couldnt update the specified group!');
    }

    res.status(201).json('Changes saved!');
  })
);

router.patch(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedGroup = await knex('groups').where({ id }).update(req.body);

    if (modifiedGroup === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified group.Try again later');
    }

    res.status(201).json('Changes saved!');
  })
);

router.delete(
  '/',
  expressAsyncHandler(async (req, res) => {
    const id = req.query.id;
    const deletedGroup = await knex('groups').where({ id }).del();

    if (deletedGroup === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified group.Try again later');
    }

    res.status(201).json('Group removed!');
  })
);

module.exports = router;
