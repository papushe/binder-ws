const Utils = require('../utils'),
    logger = Utils.getLogger(),
    notificationService = require('../services/notificationService'),
    messageService = require('../services/messageService'),
    NOTIFICATION = require('../models/Notification'),
    MESSAGE = require('../models/Message');

module.exports = (io) => {
    let allUsers = {},
        roomKey = {},
        connectedUserInSpecificCommunity = {},
        connectedUserInSpecificChatRoom = {};

    io.on('connection', (socket) => {

            socket.on('set-nickname', (nickname) => {

                addUserToAllUsers(socket, nickname);
                logger.info(`Socket: ${nickname} entered to binder`)

            });

            socket.on('disconnect', function () {

                deleteUserFromAllUsers(socket.nickname);
                logger.info(`Socket: ${socket.nickname || 'user'} left binder`)

            });

            socket.on('entered-to-community', (params) => {

                addUserToConnectedUserInSpecificCommunity(params, socket);
                socket.join(params.room);
                logger.info(`Socket: ${socket.nickname} entered to ${params.room} community`)

            });

            socket.on('left-community', (params) => {

                deleteUserFromConnectedUserInSpecificCommunity(params, socket.nickname);
                socket.leave(params.room);
                logger.info(`Socket: ${socket.nickname} left ${params.room} community`)

            });

            socket.on('join-to-community', (params) => {

                addToCommunity(params);
                logger.info(`Socket: ${socket.nickname} joined to ${params.roomName} community`)

            });

            socket.on('add-to-community-by-manager', (params) => {
                let userName = params.user.fullName;
                if (userName in allUsers) {
                    privateAddToCommunity(userName, params);
                }
                sendNotification(params, 'addByManager');
                addToCommunity(params);
                logger.info(`Socket: ${userName} added to ${params.roomName} community by `);
            });

            socket.on('delete-from-community', (params) => {
                let userName = params.user.fullName;
                if (socket.nickname === userName) {
                    logger.info(`Socket: ${userName} left ${params.roomName} permanently`)
                } else {
                    logger.info(`Socket: ${socket.nickname} deleted ${userName} from ${params.roomName} permanently`)
                }

                if (userName in connectedUserInSpecificCommunity[params.room]) {

                    deleteUserFromConnectedUserInSpecificCommunity(params, userName);

                } else if (userName in allUsers) {

                    privateDeleteFromCommunity(userName, params);

                } else {

                    sendNotification(params, 'deleteByManager');

                }
                deleteFromCommunity(params);
            });

            socket.on('activities-change', (params) => {
                if (params.event === 'create') {
                    logger.info(`Socket: ${params.activity.activity_name} was created by ${socket.nickname}`);
                    io.to(params.room).emit('activities-change', {
                        activity: params.activity,
                        from: socket.nickname,
                        communityId: params.communityId,
                        room: params.communityId,
                        date: Utils.now(),
                        event: 'add-new-activity'
                    });
                } else if (params.event === 'update') {
                    logger.info(`Socket: ${params.activity.activity_name} was updated by ${socket.nickname}`);
                    io.to(params.room).emit('activities-change', {
                        activity: params.activity,
                        from: socket.nickname,
                        communityId: params.communityId,
                        room: params.communityId,
                        date: Utils.now(),
                        event: 'update-activity'
                    });
                } else {
                    logger.info(`Socket: ${params.activity.activity_name} was deleted by ${socket.nickname}`);
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
                logger.info(`Socket: ${socket.nickname} entered to ${params.room} chat room`);
                socket.join(params.room);

                enterToPrivateChatRoom(params);

                if (allUsers[params.user.fullName]) {
                    allUsers[params.user.fullName].emit('chat-room', {
                        from: params.from,
                        to: params.user,
                        room: params.room,
                        event: 'enter-to-chat-room',
                        date: Utils.now()
                    });
                } else {

                    sendNotification(params, 'enterToChatRoom')

                }
            });

            socket.on('join-to-chat-room', (params) => {
                logger.info(`Socket: ${socket.nickname} joined to ${params.room} chat room`);
                socket.join(params.room);

                enterToPrivateChatRoom(params);

                if (allUsers[params.user.fullName]) {
                    allUsers[params.user.fullName].emit('change-event-chat-room', {
                        from: params.from,
                        to: params.user,
                        room: params.room,
                        event: 'joined',
                        date: Utils.now()
                    });
                }
            });

            socket.on('left-from-chat-room', (params) => {
                logger.info(`Socket: ${socket.nickname} left ${params.room} chat room`);
                deleteFromPrivateChatRoom(params);

                if (connectedUserInSpecificChatRoom[params.room]) {

                    if (params.user.fullName in connectedUserInSpecificChatRoom[params.room]) {

                        allUsers[params.user.fullName].emit('change-event-chat-room', {
                            from: params.from,
                            to: params.user,
                            room: params.room,
                            event: 'left',
                            date: Utils.now()
                        });
                        socket.leave(params.room);
                    }

                }
            });

            socket.on('add-message', (params) => {
                logger.info(`Socket: ${socket.nickname} add message to ${params.room} chat room`);
                io.to(params.room).emit('message', {
                    text: params.message,
                    from: socket.nickname,
                    room: params.room,
                    to: params.to,
                    date: Utils.now()
                });

                saveMessage(params);

            });

            socket.on('ask-to-join-private-room', (params) => {
                logger.info(`Socket: ${socket.nickname} ask to join to ${params.user.communityName} community`);
                if (params.user.managerName in allUsers) {

                    allUsers[params.user.managerName].emit('user-ask-to-join-private-room', {
                        community: params.user, // == community obj
                        to: params.user.managerName,
                        from: params.from,
                        room: params.user._id, // == community _id
                        event: 'user-ask-to-join-private-room',
                        communityName: params.user.communityName,
                        content: `Community name ${params.user.communityName}`,
                        date: Utils.now()
                    });
                } else {

                    sendNotification(params, 'askToJoinPrivateRoom');

                }

            });

            socket.on('decline-user-join-private-room', (params) => {

                if (params.from.fullName in allUsers) {

                    logger.info(`Socket: ${socket.nickname} decline ${params.from.fullName} user to join to ${params.communityName} community`);

                    allUsers[params.from.fullName].emit('user-ask-to-join-private-room', {
                        communityName: params.communityName,
                        to: params.to,
                        from: params.from,
                        event: 'manager-decline-user-join-private-room',
                        content: `Community name ${params.communityName}`,
                        date: Utils.now()
                    });
                } else {

                    sendNotification(params, 'declineUserJoinPrivateRoom');

                }

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

            function saveMessage(params) {


                let msgObj = new MESSAGE({
                    from: params.from.fullName,
                    date: Utils.now(),
                    room: params.room,
                    text: params.message
                });

                messageService.saveNewMessage(msgObj)
            }

            function sendNotification(params, type) {
                let from = {

                    fullName: socket.nickname,
                    id: params.fromUserId || '',
                    profilePic: params.user.profilePic
                };
                let to = {

                    fullName: params.user.fullName,
                    id: params.user.keyForFirebase || params.user.id,
                    profilePic: params.user.profilePic
                };

                let notificationObj;
                if (type === 'addByManager') {
                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        room: params.roomId,
                        status: 'unread',
                        creation_date: Utils.now(),
                        event: 'add-to-community-by-manager',
                        content: `${socket.nickname} added you to ${params.roomName} community`,
                    });
                } else if (type === 'deleteByManager') {
                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        room: params.roomId,
                        status: 'unread',
                        creation_date: Utils.now(),
                        event: 'deleted-by-manager',
                        content: `${socket.nickname} deleted you from ${params.roomName} community`,
                    });
                } else if (type === 'enterToChatRoom') {
                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        room: params.room,
                        status: 'unread',
                        creation_date: Utils.now(),
                        event: 'enter-to-chat-room',
                        content: `Chat invitation received from ${socket.nickname}`,
                    });

                } else if (type === 'askToJoinPrivateRoom') {

                    from.id = params.from.keyForFirebase;
                    to.fullName = params.user.managerName;
                    to.id = params.user.managerId;

                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        room: params.user._id, // == community._id
                        status: 'unread',
                        creation_date: Utils.now(),
                        event: 'user-ask-to-join-private-room',
                        communityName: params.user.communityName,
                        content: `Community ${params.user.communityName}`,
                    });
                } else if (type === 'declineUserJoinPrivateRoom') {
                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        status: 'unread',
                        creation_date: Utils.now(),
                        event: 'manager-decline-user-join-private-room',
                        communityName: params.communityName,
                        content: `Community ${params.communityName}`,
                    });
                }

                notificationService.saveNewNotification(notificationObj)
            }

        }
    );
};