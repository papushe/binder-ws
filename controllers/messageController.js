let MESSAGE = require('../models/Message'),
    Utils = require('../utils'),
    messageService = require('../services/messageService');

exports.createNewMessage = (req, res) => {
    let msgObj = new MESSAGE({
        from: req.body.from,
        to: req.body.to,
        status: req.body.status || 'unread',
        creation_date: Utils.now(),
        content: req.body.content || '',
    });
    messageService.saveNewMessage(msgObj)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.getMessagesByUserId = (req, res) => {
    let userId = req.params.key;
    messageService.getUserMessages(userId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};