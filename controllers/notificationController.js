let NOTIFICATION = require('../models/Notification'),
    Utils = require('../utils'),
    logger = Utils.getLogger();
    notificationService = require('../services/notificationService');

exports.createNewNotification = (req, res) => {
    let notificationObj = new NOTIFICATION({
        from: req.body.from,
        to: req.body.to,
        room: req.body.room,
        status: req.body.status || 'unread',
        creation_date: Utils.now(),
        event: req.body.event,
        content: req.body.content || '',
    });
    notificationService.saveNewNotification(notificationObj)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.getNotificationsByUserId = (req, res) => {
    let userId = req.params.key;
    notificationService.getUserNotifications(userId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};