let messageService = require('../services/messageService');

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