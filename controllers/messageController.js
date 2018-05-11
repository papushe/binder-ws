let MESSAGE = require('../models/Message'),
    Utils = require('../utils'),
    messageService = require('../services/messageService'),
    logger = Utils.getLogger();

exports.create = (req, res) => {
    let msgObj = new MESSAGE({
        room: req.body.room,
        massages: [
            {
                from: req.body.from,
                date: Utils.now(),
                roomId: req.body.room,
                content: req.body.content
            }
        ]
    });
    messageService.saveNewMessage(msgObj)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.getByRoomId = (req, res) => {
    let roomId = req.params.roomId;
    messageService.getRoomMessages(roomId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.saveUserChatByUserId = (req, res) => {
    let obj = {
        chatRoomId: req.body.chatRoomId,
        talkedToId: req.body.talkedToId,
        talkedToName: req.body.talkedToName,
        talkedFromName: req.body.talkedFromName,
        profilePic: req.body.profilePic || '',
    };

    let userId = req.body.userId;
    messageService.saveUserChat(obj, userId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};