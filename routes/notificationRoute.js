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
    const { user_id } = req.query;
    const notifications = await knex('notifications')
      .where({ user_id })
      .orderBy('created_at', 'desc');
    // console.log(notifications);
    res.status(200).json(notifications);
  })
);

router.get(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    const notification_id = req.params.id;
    const notification = await knex('notifications').where(
      'id',
      notification_id
    );
    res.status(200).json(notification[0]);
  })
);

router.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    req.body.id = randomUUID();
    const notification = await knex('notifications').insert(req.body);
    console.log(notification[0]);
    if (notification[0] !== 0) {
      return res.status(400).json('Error saving notification!');
    }

    res.status(201).json('Notification Created!');
  })
);

router.put(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedNotification = await knex('notifications')
      .where({ id })
      .update(req.body);

    if (modifiedNotification === 0) {
      return res.status(400).json('Couldnt update the specified notification!');
    }

    res.status(201).json('Changes saved!');
  })
);

router.patch(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedNotification = await knex('notifications')
      .where({ id })
      .update(req.body);

    if (modifiedNotification === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified notification.Try again later');
    }

    res.status(201).json('Changes saved!');
  })
);

router.delete(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    const id = req.params.id;
    console.log(id)
    const deletedNotification = await knex('notifications').where({ id }).del();

    if (deletedNotification === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified notification.Try again later');
    }

    res.status(201).json('Notification removed!');
  })
);

module.exports = router;
