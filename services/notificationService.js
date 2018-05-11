let NOTIFICATION = require('../models/Notification'),
    Promise = require('promise'),
    logger = require('../utils').getLogger();

exports.saveNewNotification = (notification) => {
    return new Promise((resolve, reject) => {
        notification.save(
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to create notification: ${notification} due to: ${err}`);
                    reject(false);
                }
                else {
                    logger.debug(`Notification: ${data} was created`);
                    resolve(data);
                }
            }
        );
    });
};

exports.updateNotification = (notificationObj) => {
    return new Promise((resolve, reject) => {
        NOTIFICATION.findOne({_id: {$eq: notificationObj.id}},
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to update notification: ${notificationObj.id} due to: ${err}`);
                    reject(false);
                }
                data.set({
                    status: notificationObj.status
                });
                data.save(
                    (err, data) => {
                        if (err || !data) {
                            logger.error(`failed to save notification: ${notificationObj.to.id} due to: ${err}`);
                            reject(false);
                        }
                        logger.debug(`notification: ${notificationObj.id} was updated`);
                        resolve(data);
                    }
                );
            })
    });
};

exports.getUserNotifications = (userId) => {
    return new Promise((resolve, reject) => {
        NOTIFICATION.find({"to.id": {$eq: userId}},
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to get user: ${userId} notifications due to: ${err}`);
                    reject(false);
                }
                logger.debug(`got user: ${userId} notifications`);
                resolve(data);
            });
    });
};

exports.deleteNotificationById = (notificationId) => {
    return new Promise((resolve, reject) => {
        NOTIFICATION.deleteOne({_id: {$eq: notificationId}},
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to delete notification: ${notificationId} due to: ${err}`);
                    reject(false);
                }
                logger.debug(`notification: ${notificationId} was deleted!`);
                resolve(true);
            });
    });
};
