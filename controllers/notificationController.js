let NOTIFICATION = require('../models/Notification'),
    Utils = require('../utils'),
    notificationService = require('../services/notificationService');

exports.create = (req, res) => {
    let notificationObj = new NOTIFICATION({
        from: req.body.from,
        to: req.body.to,
        room: req.body.room,
        communityName: req.body.communityName || '',
        status: req.body.status || 'unread',
        event: req.body.event,
        activity: req.body.activity,
        content: req.body.content || '',
        user: req.body.user || '',
        isAddToCalender: req.body.isAddToCalender
    });
    notificationService.saveNewNotification(notificationObj)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.update = (req, res) => {
    let notificationObj = {};
    if (req.body.from === 'notificationPage') {
        notificationObj = {
            status: req.body.status,
            keyForFirebase: req.body.keyForFirebase
        };
    } else {
        notificationObj = {
            isAddToCalender: req.body.isAddToCalender,
            keyForFirebase: req.body.keyForFirebase
        };
    }
    notificationService.updateNotification(notificationObj)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.getById = (req, res) => {
    let userId = req.params.keyForFirebase;
    notificationService.getUserNotifications(userId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.deleteById = (req, res) => {
    let notificationId = req.body.keyForFirebase;
    notificationService.deleteNotificationById(notificationId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};
exports.deleteAllByUserId = (req, res) => {
    let userId = req.body.keyForFirebase;
    notificationService.deleteAllNotificationById(userId)
        .then(response => {
            res.json(true);
        })
        .catch(err => {
            res.json(err);
        });
};
