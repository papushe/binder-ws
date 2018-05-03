let NOTIFICATION = require('../models/Notification'),
    Promise = require('promise'),
    logger = require('../utils').getLogger();

exports.saveNewNotification = (notification) => {
    return new Promise((resolve, reject) => {
        notification.save(
            (err, data) => {
                if (err) {
                    logger.error(`failed to create notification: ${notification} due to: ${err}`);
                    reject(false);
                }
                else {
                    logger.info(`Notification: ${data._id} was created`);
                    resolve(data);
                }
            }
        );
    });
};

exports.getUserNotifications = (userId) => {
    return new Promise((resolve, reject) => {
        NOTIFICATION.find({"to.id": {$eq: userId}},
            (err, data) => {
                if (err) {
                    logger.error(`failed to get user: ${userId} notifications due to: ${err}`);
                    reject(false);
                }
                logger.info(`got user: ${userId} notifications`);
                resolve(data);
            });
    });
};