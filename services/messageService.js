let MESSAGE = require('../models/Message'),
    USER = require('../models/User'),
    Promise = require('promise'),
    logger = require('../utils').getLogger(),
    Utils = require('../utils');

exports.saveNewMessage = (msg) => {
    return new Promise((resolve, reject) => {
        msg.save(
            (err, data) => {
                if (err) {
                    logger.error(`failed to create message: ${msg} due to: ${err}`);
                    reject(false);
                }
                else {
                    logger.info(`Message: ${data._id} was created`);
                    resolve(data);
                }
            }
        );
    });
};

exports.getRoomMessages = (roomId) => {
    return new Promise((resolve, reject) => {
        MESSAGE.find({room: {$eq: roomId}},
            (err, data) => {
                if (err) {
                    logger.error(`failed to get room: ${roomId} messages due to: ${err}`);
                    reject(false);
                }
                logger.info(`got room: ${roomId} messages`);
                resolve(data);
            });
    });
};

exports.saveUserChat = (obj, userId) => {
    return new Promise((resolve, reject) => {
        USER.findOneAndUpdate({keyForFirebase: {$eq: userId}},
            {$push: {chats: obj}},
            {new: true},
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to add user ${obj.chatRoomId} to chat array due to: ${err}`);
                    reject(false);
                }
                logger.info(`chat room: ${obj.chatRoomId} was saved successfully to: ${userId}`);
                resolve(data);
            });
    });
};