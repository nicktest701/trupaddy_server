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
    const group_members = await knex('group_members').orderBy('created_at', 'desc');
    res.status(200).json(group_members);
  })
);


router.get(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    const group_member_id = req.params.id;
    const group_member = await knex('group_members').where('id', group_member_id);
    res.status(200).json(group_member[0]);
  })
);

router.group_member(
  '/',
  expressAsyncHandler(async (req, res) => {
    req.body.id = randomUUID();
    const group_member = await knex('group_members').insert(req.body);
    console.log(group_member[0]);
    if (group_member[0] !== 0) {
      return res.status(400).json('Error saving group_member!');
    }

    res.status(201).json('Group_member Created!');
  })
);

router.put(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedGroup_member = await knex('group_members').where({ id }).update(req.body);

    if (modifiedGroup_member === 0) {
      return res.status(400).json('Couldnt update the specified group_member!');
    }

    res.status(201).json('Changes saved!');
  })
);

router.patch(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedGroup_member = await knex('group_members').where({ id }).update(req.body);

    if (modifiedGroup_member === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified group_member.Try again later');
    }

    res.status(201).json('Changes saved!');
  })
);

router.delete(
  '/',
  expressAsyncHandler(async (req, res) => {
    const id = req.query.id;
    const deletedGroup_member = await knex('group_members').where({ id }).del();

    if (deletedGroup_member === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified group_member.Try again later');
    }

    res.status(201).json('Group_member removed!');
  })
);

module.exports = router;
