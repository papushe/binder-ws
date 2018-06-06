let MESSAGE = require('../models/Message'),
    USER = require('../models/User'),
    Promise = require('promise'),
    Utils = require('../utils'),
    logger = Utils.getLogger();

exports.saveNewMessage = (msg) => {
    return new Promise((resolve, reject) => {
        msg.save(
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to create message: ${msg} due to: ${err}`);
                    reject(false);
                }
                else {
                    logger.debug(`Message: ${data._id} was created`);
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
                if (err || !data) {
                    logger.error(`failed to get room: ${roomId} messages due to: ${err}`);
                    reject(false);
                }
                logger.debug(`got room: ${roomId} messages`);
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

exports.deleteMessageById = (messageId) => {
    return new Promise((resolve, reject) => {
        MESSAGE.deleteOne({_id: {$eq: messageId}},
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to delete message: ${messageId} due to: ${err}`);
                    reject(false);
                }
                logger.info(`message: ${messageId} was deleted!`);
                resolve(true);
            });
    });
};