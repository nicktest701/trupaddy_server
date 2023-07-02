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
    const friend_requests = await knex('friend_requests').orderBy('created_at', 'desc');
    res.status(200).json(friend_requests);
  })
);


router.get(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    const friend_request_id = req.params.id;
    const friend_request = await knex('friend_requests').where('id', friend_request_id);
    res.status(200).json(friend_request[0]);
  })
);

router.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    req.body.id = randomUUID();
    const friend_request = await knex('friend_requests').insert(req.body);
    console.log(friend_request[0]);
    if (friend_request[0] !== 0) {
      return res.status(400).json('Error saving friend_request!');
    }

    res.status(201).json('Friend_request Created!');
  })
);

router.put(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedFriend_request = await knex('friend_requests').where({ id }).update(req.body);

    if (modifiedFriend_request === 0) {
      return res.status(400).json('Couldnt update the specified friend_request!');
    }

    res.status(201).json('Changes saved!');
  })
);

router.patch(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedFriend_request = await knex('friend_requests').where({ id }).update(req.body);

    if (modifiedFriend_request === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified friend_request.Try again later');
    }

    res.status(201).json('Changes saved!');
  })
);

router.delete(
  '/',
  expressAsyncHandler(async (req, res) => {
    const id = req.query.id;
    const deletedFriend_request = await knex('friend_requests').where({ id }).del();

    if (deletedFriend_request === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified friend_request.Try again later');
    }

    res.status(201).json('Friend_request removed!');
  })
);

module.exports = router;
