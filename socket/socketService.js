const Utils = require('../utils'),
    logger = Utils.getLogger(),
    notificationService = require('../services/notificationService'),
    messageService = require('../services/messageService'),
    NOTIFICATION = require('../models/Notification'),
    MESSAGE = require('../models/Message');

module.exports = (io) => {
    let allUsers = {},
        allUsersList = [],
        roomKey = {},
        connectedUserInSpecificCommunity = {},
        connectedUserInSpecificChatRoom = {};

    io.on('connection', (socket) => {

            socket.on('init-binder-socket', (params) => {

                if (params && socket) {
                    addUserToAllUsers(socket, params);
                    logger.debug(`Socket: ${params.fullName} entered to binder`)
                }

            });

            socket.on('disconnect', () => {

                if (socket) {
                    deleteUserFromAllUsers(socket.keyForFirebase);
                    logger.debug(`Socket: ${socket.keyForFirebase || 'user'} left binder`)
                }

            });

            socket.on('entered-to-community', (params) => {

                if (params && socket) {
                    addUserToConnectedUserInSpecificCommunity(params, socket);
                    socket.join(params.room);
                    logger.debug(`Socket: ${socket.keyForFirebase} entered to ${params.room} community`)
                }

            });

            socket.on('left-community', (params) => {

                if (params && socket) {
                    deleteUserFromConnectedUserInSpecificCommunity(params, socket.keyForFirebase);
                    socket.leave(params.room);
                    logger.debug(`Socket: ${socket.keyForFirebase} left ${params.room} community`)
                }

            });

            socket.on('join-to-community', (params) => {

                if (params && socket) {
                    addToCommunity(params);
                    logger.debug(`Socket: ${socket.keyForFirebase} joined to ${params.roomName} community`);
                }

            });

            socket.on('add-to-community-by-manager', (params) => {

                if (params && socket) {
                    let keyForFirebase = params.user.keyForFirebase;
                    if (keyForFirebase in allUsers) {
                        privateAddToCommunity(keyForFirebase, params);
                    }
                    sendNotification(params, 'addByManager');
                    addToCommunity(params);
                    logger.debug(`Socket: ${keyForFirebase} added to ${params.roomName} community by `);
                }

            });

            socket.on('delete-from-community', (params) => {

                if (params && socket) {
                    let event = '';
                    let keyForFirebase = params.user.keyForFirebase;
                    if (socket.keyForFirebase === keyForFirebase) { //if you left community

                        event = 'left';

                        logger.debug(`Socket: ${keyForFirebase} left ${params.roomName} permanently`);

                        deleteUserFromConnectedUserInSpecificCommunity(params, keyForFirebase);
                        // socket.leave(params.room)

                    } else { //if manager deleted you
                        event = 'deleted';

                        if (keyForFirebase in allUsers) {
                            privateDeleteFromCommunity(keyForFirebase, params);
                        } else {

                            sendNotification(params, 'deleteByManager');
                        }
                        logger.debug(`Socket: ${socket.keyForFirebase} deleted ${keyForFirebase} from ${params.roomName} permanently`);
                    }

                    deleteFromCommunity(params, event);
                }
            });

            socket.on('delete-community', (params) => {

                if (params && socket) {
                    let keyForFirebase = params.from.keyForFirebase;
                    deleteUserFromConnectedUserInSpecificCommunity(params, keyForFirebase);
                    let members = params.community.members;
                    logger.debug(`Socket: ${socket.keyForFirebase} deleted ${params.community.communityName} permanently`);

                    if (members && members.length > 1) {
                        members.forEach(member => {
                            if (member.memberId !== keyForFirebase) {
                                allUsers[member.memberId].emit('on-delete-community', {
                                    community: params.community,
                                    from: params.from,
                                    date: new Date().getTime(),
                                    event: 'on-delete-community',
                                    content: `${params.from.fullName} delete ${params.community.communityName}`,
                                });
                                sendNotification(params, 'onDeleteCommunity')
                            }
                        });
                    }
                }
            });

            socket.on('activities-change', (params) => {

                if (params && socket) {
                    let event = '',
                        content = ``;
                    if (params.event === 'create') {
                        event = 'add-new-activity';
                        content = `${params.from.fullName} create new activity: ${params.activity.activity_name}`;
                        logger.debug(`Socket: ${params.activity.activity_name} was created by ${socket.keyForFirebase}`);
                    } else if (params.event === 'update') {
                        event = 'update-activity';
                        content = `${params.from.fullName} update ${params.activity.activity_name} activity`;
                        logger.debug(`Socket: ${params.activity.activity_name} was updated by ${socket.keyForFirebase}`);
                    } else {
                        logger.debug(`Socket: ${params.activity.activity_name} was deleted by ${socket.keyForFirebase}`);
                        event = 'delete-activity';
                        content = `${params.from.fullName} delete ${params.activity.activity_name} activity`;
                    }

                    io.to(params.room).emit('activities-change', {
                        activity: params.activity,
                        from: params.from,
                        communityId: params.communityId,
                        room: params.communityId,
                        date: new Date().getTime(),
                        event: event,
                        content: content
                    });
                }

            });

            socket.on('enter-to-chat-room', (params) => {

                if (params && socket) {
                    logger.debug(`Socket: ${socket.keyForFirebase} entered to ${params.room} chat room`);
                    socket.join(params.room);

                    enterToPrivateChatRoom(params);

                    if (params.user.keyForFirebase in allUsers) {
                        allUsers[params.user.keyForFirebase].emit('chat-room', {
                            from: params.from,
                            to: params.user,
                            room: params.room,
                            event: 'enter-to-chat-room',
                            content: `${params.from.fullName} Invited you to chat`,
                            date: new Date().getTime()
                        });
                    } else {
                        sendNotification(params, 'enterToChatRoom')
                    }
                }

            });

            socket.on('join-to-chat-room', (params) => {

                if (params && socket) {
                    logger.debug(`Socket: ${socket.keyForFirebase} joined to ${params.room} chat room`);
                    socket.join(params.room);

                    let isIn = enterToPrivateChatRoom(params);
                    if (params.user.keyForFirebase in allUsers) {
                        if (isIn) {
                            allUsers[params.user.keyForFirebase].emit('change-event-chat-room', {
                                from: params.from,
                                to: params.user,
                                room: params.room,
                                event: 'joined',
                                content: `${params.from.fullName} has joined to chat room`,
                                date: new Date().getTime(),
                            });
                        } else {
                            allUsers[params.user.keyForFirebase].emit('chat-room', {
                                from: params.from,
                                to: params.user,
                                room: params.room,
                                event: 'enter-to-chat-room',
                                content: `${params.from.fullName} Invited you to chat`,
                                date: new Date().getTime(),
                            });
                        }
                    } else {
                        sendNotification(params, 'joinToChatRoom')
                    }
                }

            });

            socket.on('left-from-chat-room', (params) => {

                if (params && socket) {
                    logger.debug(`Socket: ${socket.keyForFirebase} left ${params.room} chat room`);
                    deleteFromPrivateChatRoom(params);

                    if (connectedUserInSpecificChatRoom[params.room]) {

                        if (params.user.keyForFirebase in connectedUserInSpecificChatRoom[params.room]) {

                            allUsers[params.user.keyForFirebase].emit('change-event-chat-room', {
                                from: params.from,
                                to: params.user,
                                room: params.room,
                                event: 'left',
                                date: new Date().getTime()
                            });
                            socket.leave(params.room);
                        }
                    }
                }

            });

            socket.on('add-message', (params) => {

                if (params && socket) {
                    logger.debug(`Socket: ${socket.keyForFirebase} add message to ${params.room} chat room`);
                    io.to(params.room).emit('message', {
                        text: params.message,
                        from: params.from.fullName,
                        room: params.room,
                        to: params.to,
                        date: new Date().getTime()
                    });
                    saveMessage(params);
                }

            });

            socket.on('ask-to-join-private-room', (params) => {

                if (params && socket) {
                    logger.debug(`Socket: ${socket.keyForFirebase} ask to join to ${params.user.communityName} community`);

                    sendNotification(params, 'askToJoinPrivateRoom');
                }

            });

            socket.on('decline-user-join-private-room', (params) => {

                if (params && socket) {

                    sendNotification(params, 'declineUserJoinPrivateRoom');
                }

            });

            socket.on('claimed-activity', (params) => {
                if (params && socket) {
                    logger.debug(`Socket: ${socket.keyForFirebase} claimed ${params.activity.activity_name}`);
                    if (params.to.id in allUsers) {

                        if (params.to.id in connectedUserInSpecificCommunity[params.community._id]) {
                        } else {
                            onClaimedActivity(params, 'on-claimed-activity-private', params.to.id);
                        }
                    }
                    onClaimedActivity(params, 'on-claimed-activity', params.community._id);
                    sendNotification(params, 'onClaimedActivity');
                }
            });

            socket.on('decline-activity', (params) => {
                if (params && socket) {
                    logger.debug(`Socket: ${socket.keyForFirebase} Decline ${params.activity.activity_name}`);
                    if (params.to.user_id in allUsers) {

                        if (params.to.user_id in connectedUserInSpecificCommunity[params.community._id]) {
                        } else {
                            onDeclineActivity(params, 'on-decline-activity-private', params.to.user_id);
                        }
                    }
                    onDeclineActivity(params, 'on-decline-activity', params.community._id);
                    sendNotification(params, 'onDeclineActivity');
                }
            });

            socket.on('approve-activity', (params) => {
                if (params && socket) {
                    logger.debug(`Socket: ${socket.keyForFirebase} approve ${params.activity.activity_name} to ${params.to.fullName}`);
                    if (params.to.user_id in allUsers) {

                        if (params.to.user_id in connectedUserInSpecificCommunity[params.community._id]) {
                        } else {
                            onApproveActivity(params, 'on-approve-activity-private', params.to.id);
                        }
                    }
                    onApproveActivity(params, 'on-approve-activity', params.community._id);
                    sendNotification(params, 'onApproveActivity');
                    sendNotification(params, 'onApproveActivityConsumer');
                }
            });

            socket.on('finish-activity', (params) => {
                if (params && socket) {
                    logger.debug(`Socket: ${socket.keyForFirebase} finish ${params.activity.activity_name}`);
                    sendNotification(params, 'onFinishActivity');
                }
            });

            socket.on('cancel-activity', (params) => {
                if (params && socket) {
                    logger.debug(`Socket: ${socket.keyForFirebase} finish ${params.activity.activity_name}`);
                    sendNotification(params, 'onCancelActivity');
                }
            });


// socket functions
            function addUserToAllUsers(socket, params) {
                socket.keyForFirebase = params.keyForFirebase;
                if (socket.keyForFirebase in allUsers) {

                } else {

                    allUsers[socket.keyForFirebase] = socket;
                    allUsersList.push(params.keyForFirebase);
                }
                io.emit('users-changed', {
                    allUsersList: allUsersList,
                    event: 'joined'
                });


            }

            function deleteUserFromAllUsers(keyForFirebase) {
                delete allUsers[keyForFirebase];
                let index = allUsersList.indexOf(keyForFirebase);
                if (index > -1) {
                    allUsersList.splice(index, 1);
                }
                io.emit('users-changed', {
                    allUsersList: allUsersList,
                    event: 'left'
                });
            }

            function addUserToConnectedUserInSpecificCommunity(params, socket) {
                roomKey[socket.keyForFirebase] = socket;
                connectedUserInSpecificCommunity[params.room] = roomKey;
            }

            function deleteUserFromConnectedUserInSpecificCommunity(params, keyForFirebase) {

                if (params.room in connectedUserInSpecificCommunity &&
                    socket.keyForFirebase in connectedUserInSpecificCommunity[params.room]) {

                    delete connectedUserInSpecificCommunity[params.room][keyForFirebase];
                }
            }

            function enterToPrivateChatRoom(params) {
                roomKey[socket.keyForFirebase] = socket;
                connectedUserInSpecificChatRoom[params.room] = roomKey;
                return params.user.keyForFirebase in connectedUserInSpecificChatRoom[params.room]
            }

            function deleteFromPrivateChatRoom(params) {
                if (params.room in connectedUserInSpecificChatRoom &&
                    socket.keyForFirebase in connectedUserInSpecificChatRoom[params.room]) {

                    delete connectedUserInSpecificChatRoom[params.room][socket.keyForFirebase];
                }
            }

            function privateDeleteFromCommunity(keyForFirebase, params) {
                allUsers[keyForFirebase].emit('members-changed-private', {
                    from: params.from,
                    communityName: params.roomName,
                    user: params.user,
                    communityId: params.roomId,
                    event: 'deleted',
                    content: `${params.from.fullName} delete you from community`,
                    date: new Date().getTime(),
                });
            }

            function deleteFromCommunity(params, event) {
                io.to(params.room).emit('members-changed', {
                    from: params.from || params.user,
                    communityName: params.roomName,
                    user: params.user,
                    communityId: params.roomId,
                    event: event,
                    content: `${params.from.fullName} delete you from community`,
                    date: new Date().getTime()
                });
            }

            function privateAddToCommunity(keyForFirebase, params) {
                allUsers[keyForFirebase].emit('members-changed-private', {
                    from: params.from,
                    communityName: params.roomName,
                    user: params.user,
                    communityId: params.roomId,
                    event: 'joined',
                    content: `${params.from.fullName} add you to community`,
                    date: new Date().getTime()
                });
            }

            function addToCommunity(params) {
                io.to(params.room).emit('members-changed', {
                    from: params.user,
                    communityName: params.roomName,
                    user: params.user,
                    communityId: params.roomId,
                    event: 'joined',
                    date: new Date().getTime()
                });
            }

            function saveMessage(params) {


                let msgObj = new MESSAGE({
                    from: params.from.fullName,
                    date: new Date().getTime(),
                    room: params.room,
                    text: params.message
                });

                messageService.saveNewMessage(msgObj)
            }


            function onClaimedActivity(params, type, to) {

                if (type === 'on-claimed-activity') {

                    io.to(to).emit(type, {
                        activity: params.activity,
                        to: params.to,
                        from: params.from,
                        event: 'on-claimed-activity',
                        content: `${params.from.fullName} ask to claimed Activity ${params.activity.activity_name}`,
                        date: new Date().getTime()
                    });
                } else {
                    allUsers[to].emit(type, {
                        activity: params.activity,
                        to: params.to,
                        from: params.from,
                        event: 'on-claimed-activity',
                        content: `${params.from.fullName} ask to claimed Activity ${params.activity.activity_name}`,
                        date: new Date().getTime()
                    });
                }
            }

            function onDeclineActivity(params, type, to) {

                if (type === 'on-decline-activity') {

                    io.to(to).emit(type, {
                        activity: params.activity,
                        to: params.to,
                        from: params.from,
                        event: 'on-decline-activity',
                        content: `${params.from.fullName} decline ${params.activity.activity_name} request`,
                        date: new Date().getTime()
                    });
                } else {
                    allUsers[to].emit(type, {
                        activity: params.activity,
                        to: params.to,
                        from: params.from,
                        event: 'on-decline-activity',
                        content: `${params.from.fullName} decline ${params.activity.activity_name} request`,
                        date: new Date().getTime()
                    });
                }
            }

            function onApproveActivity(params, type, to) {

                if (type === 'on-approve-activity') {

                    io.to(to).emit(type, {
                        activity: params.activity,
                        to: params.to,
                        from: params.from,
                        event: 'on-approve-activity',
                        content: `${params.from.fullName} approve ${params.activity.activity_name} request`,
                        date: new Date().getTime()
                    });
                } else {
                    allUsers[to].emit(type, {
                        activity: params.activity,
                        to: params.to,
                        from: params.from,
                        event: 'on-approve-activity',
                        content: `${params.from.fullName} approve ${params.activity.activity_name} request`,
                        date: new Date().getTime()
                    });
                }
            }

            function sendSocketNotification(notification) {

                allUsers[notification.to.keyForFirebase].emit('notification',
                    notification
                );
            }

            function sendNotification(params, type) {
                let from = {

                    fullName: params.from ? params.from.fullName : '',
                    keyForFirebase: socket.keyForFirebase,
                    profilePic: params.user ? params.user.profilePic : ''
                };

                let to = {

                    fullName: params.user ? params.user.fullName : '',
                    keyForFirebase: params.user ? params.user.keyForFirebase : '',
                    profilePic: params.user ? params.user.profilePic : ''
                };

                let notificationObj;
                if (type === 'addByManager') {
                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        room: params.roomId,
                        status: 'unread',
                        communityName: params.roomName,
                        event: 'add-to-community-by-manager',
                        content: `${from.fullName} added you to ${params.roomName} community`,
                        date: new Date().getTime()
                    });
                } else if (type === 'deleteByManager') {
                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        room: params.roomId,
                        status: 'unread',
                        event: 'deleted-by-manager',
                        content: `${from.fullName} deleted you from ${params.roomName} community`,
                        date: new Date().getTime()
                    });
                } else if (type === 'onDeleteCommunity') {
                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        room: params.roomId,
                        status: 'unread',
                        event: 'delete-community',
                        content: `${from.fullName} deleted ${params.community.communityName} permanently`,
                        date: new Date().getTime()
                    });
                } else if (type === 'enterToChatRoom') {
                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        room: params.room,
                        status: 'unread',
                        event: 'enter-to-chat-room',
                        content: `${params.from.fullName} Invited you to chat`,
                        date: new Date().getTime()
                    });
                } else if (type === 'joinToChatRoom') {
                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        room: params.room,
                        status: 'unread',
                        event: 'join-to-chat-room',
                        content: `${from.fullName} has joined to chat room`,
                        date: new Date().getTime()
                    });
                } else if (type === 'askToJoinPrivateRoom') {

                    from.keyForFirebase = params.from.keyForFirebase;
                    to.fullName = params.user.manager.name;
                    to.keyForFirebase = params.user.manager.id;

                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        user: params.from,
                        room: params.user._id, // == community._id
                        status: 'unread',
                        event: 'user-ask-to-join-private-room',
                        communityName: params.user.communityName,
                        content: `${params.from.fullName} ask to join to ${params.user.communityName}`,
                        date: new Date().getTime()
                    });
                } else if (type === 'declineUserJoinPrivateRoom') {

                    from.keyForFirebase = params.to.keyForFirebase;
                    from.fullName = params.to.fullName;

                    to.keyForFirebase = params.from.keyForFirebase;
                    to.fullName = params.from.fullName;

                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        status: 'unread',
                        event: 'manager-decline-user-join-private-room',
                        communityName: params.communityName,
                        content: `${params.from.fullName} decline your request to join to ${params.user.communityName}`,
                        date: new Date().getTime()
                    });
                } else if (type === 'onClaimedActivity') {

                    to.fullName = params.to.name;
                    to.keyForFirebase = params.to.id;

                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        status: 'unread',
                        event: 'user-ask-to-claimed-activity',
                        communityName: params.activity.activity_name,
                        activity: params.activity,
                        content: `${params.from.fullName} ask to claimed Activity ${params.activity.activity_name}`,
                        date: new Date().getTime()
                    });
                } else if (type === 'onApproveActivity') {

                    to.fullName = params.to.fullName;
                    to.keyForFirebase = params.to.user_id;

                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        status: 'unread',
                        event: 'user-approve-activity',
                        communityName: params.activity.activity_name,
                        activity: params.activity,
                        content: `${params.from.fullName} approve ${params.activity.activity_name} request`,
                        date: new Date().getTime()
                    });
                } else if (type === 'onApproveActivityConsumer') {

                    to.fullName = params.from.fullName;
                    to.keyForFirebase = params.from.keyForFirebase;

                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        status: 'unread',
                        event: 'you-approved-activity',
                        communityName: params.activity.activity_name,
                        activity: params.activity,
                        content: `You approve ${params.activity.activity_name} request`,
                        date: new Date().getTime()
                    });
                } else if (type === 'onDeclineActivity') {

                    to.fullName = params.to.fullName;
                    to.keyForFirebase = params.to.user_id;

                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        status: 'unread',
                        event: 'user-decline-activity',
                        communityName: params.activity.activity_name,
                        activity: params.activity,
                        content: `${params.from.fullName} decline ${params.activity.activity_name} request`,
                        date: new Date().getTime()
                    });
                } else if (type === 'onActivityStartConsumer') {

                    from.fullName = params.provider.name;
                    from.keyForFirebase = params.provider.id;

                    to.fullName = params.consumer.name;
                    to.keyForFirebase = params.consumer.id;

                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        status: 'unread',
                        event: 'activity-is-about-to-start',
                        communityName: params, //activity
                        content: `Activity ${params.activity_name} is about to start`,
                        date: new Date().getTime()
                    });
                } else if (type === 'onActivityStartProvider') {

                    to.fullName = params.provider.name;
                    to.keyForFirebase = params.provider.id;

                    from.fullName = params.consumer.name;
                    from.keyForFirebase = params.consumer.id;

                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        status: 'unread',
                        event: 'activity-is-about-to-start',
                        communityName: params, //activity
                        content: `Activity ${params.activity_name} is about to start`,
                        date: new Date().getTime()
                    });
                } else if (type === 'onFinishActivity') {

                    from.fullName = params.from.fullName;
                    from.keyForFirebase = socket.keyForFirebase;

                    to.fullName = params.to.name;
                    to.keyForFirebase = params.to.id;

                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        activity: params.activity,
                        status: 'unread',
                        event: 'activity-finish',
                        communityName: params, //activity
                        content: `Activity ${params.activity.activity_name} has finished`,
                        date: new Date().getTime()
                    });
                }
                else if (type === 'onCancelActivity') {

                    from.fullName = params.from.fullName;
                    from.keyForFirebase = socket.keyForFirebase;

                    if (params.from.fullName === params.activity.provider.name) {
                        to.fullName = params.activity.consumer.name;
                        to.keyForFirebase = params.activity.consumer.id;
                    } else {
                        to.fullName = params.activity.provider.name;
                        to.keyForFirebase = params.activity.provider.id;
                    }

                    notificationObj = new NOTIFICATION({
                        from: from,
                        to: to,
                        activity: params.activity,
                        status: 'unread',
                        event: 'activity-canceled',
                        content: `Activity ${params.activity.activity_name} has canceled`,
                        date: new Date().getTime()
                    });
                }

                if (to.keyForFirebase in allUsers) {
                    sendSocketNotification(notificationObj)
                }
                else {
                    notificationService.saveNewNotification(notificationObj)
                }
            }

            module.exports.sendNotification = sendNotification;
        }
    );
};