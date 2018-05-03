let MESSAGE = require('../models/Message'),
    Promise = require('promise'),
    logger = require('../utils').getLogger();

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