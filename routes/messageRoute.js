/**
 * @type {Knex}
 */
const router = require('express').Router();
const expressAsyncHandler = require('express-async-handler');
const { randomUUID } = require('crypto');
const _ = require('lodash');
const knex = require('../config/knex');
const verifyJWT = require('../middleware/verifyJWT');
const io = require('../server');

router.get(
  '/',
  // verifyJWT,
  expressAsyncHandler(async (req, res) => {
    const { user_id } = req.query;
    // const user_id = req.user._id;

    const messages = await knex('messages')
      .join('users', 'messages.sender_id', '=', 'users.id')
      .select(
        'users.id as friend_id',
        ' users.full_name as sender ',
        'users.profile_image as avatar',
        'messages.content',
        'messages.created_at '
      )
      .where('messages.sender_id', user_id)
      .orWhere('messages.receiver_id', user_id)

      .union(
        knex('messages')
          .join('users', 'messages.receiver_id', '=', 'users.id')
          .select(
            'users.id as friend_id',
            ' users.full_name as sender ',
            'users.profile_image as avatar',
            'messages.content',
            'messages.created_at'
          )
          .where('messages.sender_id', user_id)
          .orWhere('messages.receiver_id', user_id)
      );

    const friendsOnly = _.uniqBy(
      _.filter(
        _.orderBy(messages, 'created_at', 'desc'),
        ({ friend_id, content }) => friend_id !== user_id && !_.isEmpty(content)
      ),
      'friend_id'
    );

    //Remove current user from chat list

    const deserializedMessages = friendsOnly.map((message) => {
      const chat = _.toPlainObject(message);
      const content = JSON.parse(chat.content);

      return {
        friend_id: message?.friend_id,
        sender: message?.sender,
        avatar: message?.avatar,
        content: content?.text,
        created_at: message?.created_at,
      };
    });

    res.status(200).json(deserializedMessages);
  })
);

//@ GET all messages between a user and a friend
router.get(
  '/chat-history',
  verifyJWT,
  expressAsyncHandler(async (req, res) => {
    const { user_id, friend_id } = req.query;
    // const user_id = req.user._id;

    const messages = await knex('messages')
      .join('users', 'messages.sender_id', '=', 'users.id')
      .select('messages.content')
      .where({
        'messages.sender_id': user_id,
        'messages.receiver_id': friend_id,
      })
      .orWhere({
        'messages.sender_id': friend_id,
        'messages.receiver_id': user_id,
      })
      .orderBy('messages.created_at', 'desc');

    if (_.isEmpty(messages)) {
      await knex('messages').insert({
        id: randomUUID(),
        sender_id: user_id,
        receiver_id: friend_id,

        content: JSON.stringify({}),
      });

      //Generate chat room id
      const token = randomUUID();
      await knex('messages_room').insert({
        id: randomUUID(),
        sender_id: user_id,
        receiver_id: friend_id,
        token: token,
      });

      return res.status(200).json({
        token: token,
        history: [],
      });
    }

    const room_token = await knex('messages_room')
      .where({
        sender_id: user_id,
        receiver_id: friend_id,
      })
      .orWhere({
        sender_id: friend_id,
        receiver_id: user_id,
      })
      .select('token');

    const deserializedMessages = messages.map((message) => {
      const chat = _.toPlainObject(message);

      return JSON.parse(chat.content);
    });

    //Remove all chats with empty content
    const allMessages = _.filter(
      deserializedMessages,
      (item) => !_.isEmpty(item)
    );

    res.status(200).json({
      token: room_token[0].token,
      history: allMessages,
    });
  })
);

router.get(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    const { user_id, friend_id } = req.query;

    const messages = await knex('messages')
      .where({ user_id, friend_id })
      .orWhere({ friend_id: user_id, user_id: friend_id })
      .select('content', 'created_at')
      .orderBy('created_at', 'desc');

    res.status(200).json(message[0]);
  })
);

router.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    req.body.id = randomUUID();
    const message = await knex('messages').insert(req.body);

    if (message[0] !== 0) {
      return res.status(400).json('Error saving message!');
    }

    res.status(201).json('Message Created!');
  })
);

router.put(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedMessage = await knex('messages')
      .where({ id })
      .update(req.body);

    if (modifiedMessage === 0) {
      return res.status(400).json('Couldnt update the specified message!');
    }

    res.status(201).json('Changes saved!');
  })
);

router.patch(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.body;
    const modifiedMessage = await knex('messages')
      .where({ id })
      .update(req.body);

    if (modifiedMessage === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified message.Try again later');
    }

    res.status(201).json('Changes saved!');
  })
);

router.delete(
  '/',
  expressAsyncHandler(async (req, res) => {
    const id = req.query.id;
    const deletedMessage = await knex('messages').where({ id }).del();

    if (deletedMessage === 0) {
      return res
        .status(400)
        .json('Couldnt update the specified message.Try again later');
    }

    res.status(201).json('Message removed!');
  })
);

module.exports = router;
