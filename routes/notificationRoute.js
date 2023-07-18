/**
 * @type {Knex}
 */
const router = require('express').Router();
const expressAsyncHandler = require('express-async-handler');
const { randomUUID } = require('crypto');
const _ = require('lodash');
const knex = require('../config/knex');
const moment = require('moment');

router.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { user_id } = req.query;
    const notifications = await knex('notifications')
      .where({ user_id })
      .orderBy('created_at', 'desc');

  ;

    const modifiedNotifications = notifications.map((notif) => {
      return {
        ...notif,
        title: moment(notif.created_at).fromNow(),
      };
    });

    // Grouping the objects by 'created_at' with title for each group
    const groupedData = [];
    modifiedNotifications.sort((a, b) => a.title.localeCompare(b.title)); // Sort the array by 'title'

    modifiedNotifications.forEach((obj) => {
      const createdAt = obj.title;
      const existingGroup = groupedData.find(
        (group) => group.title === createdAt
      );

      if (existingGroup) {
        existingGroup.data.push(obj); // Add the object to an existing group
      } else {
        groupedData.push({ title: createdAt, data: [obj] }); // Create a new group with a title and add the object
      }
    });

    res.status(200).json(groupedData);
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

    if (notification[0] !== 0) {
      return res.status(400).json('Error saving notification!');
    }

    res.status(201).json('Notification Created!');
  })
);

router.put(
  '/status',
  expressAsyncHandler(async (req, res) => {
    const { id, status } = req.body;
    const modifiedNotification = await knex('notifications')
      .where({ id })
      .update({ status });

    if (modifiedNotification === 0) {
      return res.status(400).json('Couldnt update the specified notification!');
    }

    res.status(201).json('Changes saved!');
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
