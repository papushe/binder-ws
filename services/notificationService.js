let NOTIFICATION = require('../models/Notification');
let Promise = require('promise');

exports.saveNewNotification = (notification) => {
    return new Promise((resolve, reject) => {
        notification.save(
            (err, data) => {
                if (err) {
                    console.error(`failed to create notification: ${notification} due to: ${err}`);
                    reject(false);
                }
                else {
                    console.log(`Notification: ${data._id} was created`);
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
                    console.error(`failed to get user: ${userId} notifications due to: ${err}`);
                    reject(false);
                }
                console.log(`got user: ${userId} notifications`);
                resolve(data);
            });
    });
};