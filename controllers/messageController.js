let MESSAGE = require('../models/Message'),
    Utils = require('../utils'),
    messageService = require('../services/messageService'),
    logger = Utils.getLogger();

exports.createNewMessage = (req, res) => {
    let msgObj = new MESSAGE({
        from: req.body.from,
        to: req.body.to,
        room: req.body.room,
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

exports.getMessagesByRoomId = (req, res) => {
    let roomId = req.params.key;
    messageService.getRoomMessages(roomId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};