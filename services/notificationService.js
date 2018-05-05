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

exports.updateNotification = (notificationObj) => {
    return new Promise((resolve, reject) => {
        NOTIFICATION.findOne({"to.id": {$eq: notificationObj.id}},
            (err, data) => {
                if (err) {
                    logger.error(`failed to update notification: ${notificationObj.id} due to: ${err}`);
                    reject(false);
                }
                data.set({
                    status: notificationObj.status
                });
                data.save(
                    (err, data) => {
                        if (err) {
                            logger.error(`failed to save notification: ${notificationObj.to.id} due to: ${err}`);
                            reject(false);
                        }
                        logger.info(`notification: ${notificationObj.id} was updated`);
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
                if (err) {
                    logger.error(`failed to get user: ${userId} notifications due to: ${err}`);
                    reject(false);
                }
                logger.info(`got user: ${userId} notifications`);
                resolve(data);
            });
    });
};

exports.deleteNotificationById = (notificationId) => {
    return new Promise((resolve, reject) => {
        NOTIFICATION.deleteOne({_id: {$eq: notificationId}},
            (err, data) => {
                if (err) {
                    logger.error(`failed to delete notification: ${notificationId} due to: ${err}`);
                    reject(false);
                }
                logger.info(`notification: ${notificationId} was deleted!`);
                resolve(true);
            });
    });
};
