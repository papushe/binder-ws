let MESSAGE = require('../models/Message');
let Promise = require('promise');

exports.saveNewMessage = (msg) => {
    return new Promise((resolve, reject) => {
        msg.save(
            (err, data) => {
                if (err) {
                    console.error(`failed to create message: ${msg} due to: ${err}`);
                    reject(false);
                }
                else {
                    console.log(`Message: ${data._id} was created`);
                    resolve(data);
                }
            }
        );
    });
};

exports.getUserMessages = (userId) => {
    return new Promise((resolve, reject) => {
        MESSAGE.find({"to.id": {$eq: userId}},
            (err, data) => {
                if (err) {
                    console.error(`failed to get user: ${userId} messages due to: ${err}`);
                    reject(false);
                }
                console.log(`got user: ${userId} messages`);
                resolve(data);
            });
    });
};