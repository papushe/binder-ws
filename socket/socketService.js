const Utils = require('../utils'),
    logger = Utils.getLogger(),
    notificationService = require('../services/notificationService'),
    NOTIFICATION = require('../models/Notification');

module.exports = (io) => {
    let allUsers = {},
        roomKey = {},
        connectedUserInSpecificCommunity = {},
        connectedUserInSpecificChatRoom = {};

    io.on('connection', (socket) => {

        socket.on('set-nickname', (nickname) => {

            addUserToAllUsers(socket, nickname);

            io.emit('users-changed', {
                user: nickname,
                event: 'joined',
                date: Utils.now()
            });
        });

        socket.on('disconnect', function () {

            deleteUserFromAllUsers(socket.nickname);

            io.emit('users-changed', {
                user: socket.nickname,
                event: 'left',
                date: Utils.now()
            });
        });

        socket.on('entered-to-community', (params) => {

            addUserToConnectedUserInSpecificCommunity(params, socket);

            socket.join(params.room);
            io.to(params.room).emit('members-changed', {
                from: socket.nickname,
                communityName: params.roomName,
                communityId: params.roomId,
                event: 'enter',
                date: Utils.now()
            });
        });

        socket.on('left-community', (params) => {

            deleteUserFromConnectedUserInSpecificCommunity(params, socket.nickname);

            io.to(params.room).emit('members-changed', {
                from: socket.nickname,
                communityName: params.roomName,
                communityId: params.roomId,
                event: 'left',
                date: Utils.now()
            });
            socket.leave(params.room);

        });

        socket.on('join-to-community', (params) => {

            addToCommunity(params);

        });

        socket.on('add-to-community-by-manager', (params) => {
            let userName = params.user.firstName + ' ' + params.user.lastName;
            if (userName in allUsers) {
                privateAddToCommunity(userName, params);
            } else {
                sendNotification(params, 'addByManager');
            }
            addToCommunity(params);
        });

        socket.on('delete-from-community', (params) => {
            let userName = params.user.fullName;

            if (userName in connectedUserInSpecificCommunity[params.room]) {

                deleteUserFromConnectedUserInSpecificCommunity(params, userName);

                deleteFromCommunity(params);

                socket.leave(params.room);

            } else if (userName in allUsers) {

                privateDeleteFromCommunity(userName, params);

                deleteFromCommunity(params);

            } else {

                deleteFromCommunity(params);
                sendNotification(params, 'deleteByManager');

            }
        });

        socket.on('activities-change', (params) => {
            if (params.event == 'create') {
                io.to(params.room).emit('activities-change', {
                    activity: params.activity,
                    from: socket.nickname,
                    communityId: params.communityId,
                    room: params.communityId,
                    date: Utils.now(),
                    event: 'add-new-activity'
                });
            } else if (params.event == 'update') {
                io.to(params.room).emit('activities-change', {
                    activity: params.activity,
                    from: socket.nickname,
                    communityId: params.communityId,
                    room: params.communityId,
                    date: Utils.now(),
                    event: 'update-activity'
                });
            } else {
                io.to(params.room).emit('activities-change', {
                    activity: params.activity,
                    from: socket.nickname,
                    communityId: params.communityId,
                    room: params.communityId,
                    date: Utils.now(),
                    event: 'delete-activity'
                });
            }
        });

        socket.on('enter-to-chat-room', (params) => {
            socket.join(params.room);

            enterToPrivateChatRoom(params);

            if (allUsers[params.to.fullName]) {
                allUsers[params.to.fullName].emit('chat-room', {
                    from: params.from,
                    to: params.to,
                    room: params.room,
                    event: 'enter-to-chat-room',
                    date: Utils.now()
                });
            } else {
                //user 'to' not connected to the app
                //add to notification mongo
            }
        });

        socket.on('join-to-chat-room', (params) => {
            socket.join(params.room);

            enterToPrivateChatRoom(params);

            if (allUsers[params.to.fullName]) {
                allUsers[params.to.fullName].emit('change-event-chat-room', {
                    from: params.from,
                    to: params.to,
                    room: params.room,
                    event: 'joined',
                    date: Utils.now()
                });
            } else {
                //add to notification mongo
            }
        });

        socket.on('left-from-chat-room', (params) => {

            deleteFromPrivateChatRoom(params);

            if (params.to.fullName in connectedUserInSpecificChatRoom[params.room]) {

                allUsers[params.to.fullName].emit('change-event-chat-room', {
                    from: params.from,
                    to: params.to,
                    room: params.room,
                    event: 'left',
                    date: Utils.now()
                });
                socket.leave(params.room);
            }
        });

        socket.on('add-message', (params) => {

            //if user is connected{
            io.to(params.room).emit('message', {
                text: params.message,
                from: socket.nickname,
                room: params.room,
                to: params.to,
                date: Utils.now()
            });
            // } else{
            //add notification to mongo
            // }
        });

// socket functions
        function addUserToAllUsers(socket, nickname) {
            socket.nickname = nickname;
            if (socket.nickname in allUsers) {

            } else {

                allUsers[socket.nickname] = socket;
            }
        }

        function deleteUserFromAllUsers(nickname) {
            delete allUsers[nickname];
        }

        function addUserToConnectedUserInSpecificCommunity(params, socket) {
            roomKey[socket.nickname] = socket;
            connectedUserInSpecificCommunity[params.room] = roomKey;
        }

        function deleteUserFromConnectedUserInSpecificCommunity(params, userName) {

            if (params.room in connectedUserInSpecificCommunity &&
                socket.nickname in connectedUserInSpecificCommunity[params.room]) {

                delete connectedUserInSpecificCommunity[params.room][userName];
            }
        }

        function enterToPrivateChatRoom(params) {
            roomKey[socket.nickname] = socket;
            connectedUserInSpecificChatRoom[params.room] = roomKey;
        }

        function deleteFromPrivateChatRoom(params) {
            if (params.room in connectedUserInSpecificChatRoom &&
                socket.nickname in connectedUserInSpecificChatRoom[params.room]) {

                delete connectedUserInSpecificChatRoom[params.room][socket.nickname];
            }
        }

        function privateDeleteFromCommunity(userName, params) {
            allUsers[userName].emit('members-changed-private', {
                from: socket.nickname,
                communityName: params.roomName,
                user: params.user,
                communityId: params.roomId,
                event: 'deleted',
                date: Utils.now()
            });
        }

        function deleteFromCommunity(params) {
            io.to(params.room).emit('members-changed', {
                from: socket.nickname,
                communityName: params.roomName,
                user: params.user,
                communityId: params.roomId,
                event: 'deleted',
                date: Utils.now()
            });
        }

        function privateAddToCommunity(userName, params) {
            allUsers[userName].emit('members-changed-private', {
                from: socket.nickname,
                communityName: params.roomName,
                user: params.user,
                communityId: params.roomId,
                event: 'joined',
                date: Utils.now()
            });
        }

        function addToCommunity(params) {
            io.to(params.room).emit('members-changed', {
                from: socket.nickname,
                communityName: params.roomName,
                user: params.user,
                communityId: params.roomId,
                event: 'joined',
                date: Utils.now()
            });
        }

        function sendNotification(params, type) {
            let from = {

                fullName: socket.nickname,
                id: params.fromUserId,
            };
            let to = {

                fullName: params.user.fullName,
                id: params.user.keyForFirebase,
            };

            let notificationObj;
            if (type === 'addByManager') {
                notificationObj = new NOTIFICATION({
                    from: from,
                    to: to,
                    room: '',
                    status: 'unread',
                    creation_date: Utils.now(),
                    event: 'add-to-community-by-manager',
                    content: `${socket.nickname} added you to ${params.roomName} community`,
                });
            } else if (type === 'deleteByManager') {
                notificationObj = new NOTIFICATION({
                    from: from,
                    to: to,
                    room: '',
                    status: 'unread',
                    creation_date: Utils.now(),
                    event: 'deleted-by-manager',
                    content: `${socket.nickname} deleted you from ${params.roomName} community`,
                });
            }

            notificationService.saveNewNotification(notificationObj)
        }

    });
};