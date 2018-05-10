let MESSAGE = require('../models/Message'),
    Utils = require('../utils'),
    messageService = require('../services/messageService'),
    logger = Utils.getLogger();

exports.createNewMessage = (req, res) => {
    let msgObj = new MESSAGE({
        from: req.body.from,
        room: req.body.room,
        date: req.body.date,
        text: req.body.text,
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