let Utils = require('../utils'),
    logger = Utils.getLogger(),
    notificationService = require('../services/notificationService'),
    messageService = require('../services/messageService'),
    NOTIFICATION = require('../models/Notification'),
    MESSAGE = require('../models/Message'),
    allUsers = {},
    roomKey = {},
    connectedUserInSpecificCommunity = {},
    connectedUserInSpecificChatRoom = {},
    SOCKET,
    IO;


exports.INITSOCKET = (io) => {
    IO = io;
    IO.on('connection', (socket) => {
            SOCKET = socket;
            SOCKET.on('init-binder-socket', (params) => {

                if (params && socket) {
                    this.addUserToAllUsers(socket, params);
                    logger.debug(`Socket: ${params.fullName} entered to binder`)
                }

            });

            SOCKET.on('disconnect', () => {

                if (socket) {
                    this.deleteUserFromAllUsers(SOCKET.keyForFirebase);
                    logger.debug(`Socket: ${SOCKET.keyForFirebase || 'user'} left binder`)
                }

            });

            SOCKET.on('entered-to-community', (params) => {

                if (params && socket) {
                    this.addUserToConnectedUserInSpecificCommunity(params, socket);
                    SOCKET.join(params.room);
                    logger.debug(`Socket: ${SOCKET.keyForFirebase} entered to ${params.room} community`)
                }

            });

            SOCKET.on('left-community', (params) => {

                if (params && socket) {
                    this.deleteUserFromConnectedUserInSpecificCommunity(params, SOCKET.keyForFirebase);
                    SOCKET.leave(params.room);
                    logger.debug(`Socket: ${SOCKET.keyForFirebase} left ${params.room} community`)
                }

            });

            SOCKET.on('join-to-community', (params) => {

                if (params && socket) {
                    this.addToCommunity(params);
                    logger.debug(`Socket: ${SOCKET.keyForFirebase} joined to ${params.roomName} community`);
                }

            });

            SOCKET.on('add-to-community-by-manager', (params) => {

                if (params && socket) {
                    let keyForFirebase = params.user.keyForFirebase;
                    if (keyForFirebase in allUsers) {
                        this.privateAddToCommunity(keyForFirebase, params);
                    }
                    this.sendNotification(params, 'addByManager');
                    this.addToCommunity(params);
                    logger.debug(`Socket: ${keyForFirebase} added to ${params.roomName} community by `);
                }

            });

            SOCKET.on('delete-from-community', (params) => {

                if (params && socket) {
                    let event = '';
                    let keyForFirebase = params.user.keyForFirebase;
                    if (SOCKET.keyForFirebase === keyForFirebase) { //if you left community

                        event = 'left';

                        logger.debug(`Socket: ${keyForFirebase} left ${params.roomName} permanently`);

                        this.deleteUserFromConnectedUserInSpecificCommunity(params, keyForFirebase);
                        // SOCKET.leave(params.room)

                    } else { //if manager deleted you
                        event = 'deleted';

                        if (keyForFirebase in allUsers) {
                            this.privateDeleteFromCommunity(keyForFirebase, params);
                        }
                        logger.debug(`Socket: ${SOCKET.keyForFirebase} deleted ${keyForFirebase} from ${params.roomName} permanently`);
                    }

                    this.sendNotification(params, 'deleteByManager');
                    this.deleteFromCommunity(params, event);
                }
            });

            SOCKET.on('delete-community', (params) => {

                if (params && socket) {
                    let keyForFirebase = params.from.keyForFirebase;
                    this.deleteUserFromConnectedUserInSpecificCommunity(params, keyForFirebase);
                    let members = params.community.members;
                    logger.debug(`Socket: ${SOCKET.keyForFirebase} deleted ${params.community.communityName} permanently`);

                    if (members && members.length > 1) {
                        members.forEach(member => {
                            if (member.memberId !== keyForFirebase) {
                                allUsers[member.memberId].emit('on-delete-community', {
                                    community: params.community,
                                    from: params.from,
                                    date: Utils.now(),
                                    event: 'on-delete-community'
                                });
                                this.sendNotification(params, 'onDeleteCommunity')
                            }
                        });
                    }
                }
            });

            SOCKET.on('activities-change', (params) => {

                if (params && socket) {
                    if (params.event === 'create') {
                        logger.debug(`Socket: ${params.activity.activity_name} was created by ${SOCKET.keyForFirebase}`);
                        IO.to(params.room).emit('activities-change', {
                            activity: params.activity,
                            from: params.from,
                            communityId: params.communityId,
                            room: params.communityId,
                            date: Utils.now(),
                            event: 'add-new-activity'
                        });
                    } else if (params.event === 'update') {
                        logger.debug(`Socket: ${params.activity.activity_name} was updated by ${SOCKET.keyForFirebase}`);
                        IO.to(params.room).emit('activities-change', {
                            activity: params.activity,
                            from: params.from,
                            communityId: params.communityId,
                            room: params.communityId,
                            date: Utils.now(),
                            event: 'update-activity'
                        });
                    } else {
                        logger.debug(`Socket: ${params.activity.activity_name} was deleted by ${SOCKET.keyForFirebase}`);
                        IO.to(params.room).emit('activities-change', {
                            activity: params.activity,
                            from: params.from,
                            communityId: params.communityId,
                            room: params.communityId,
                            date: Utils.now(),
                            event: 'delete-activity'
                        });
                    }
                }

            });

            SOCKET.on('enter-to-chat-room', (params) => {

                if (params && socket) {
                    logger.debug(`Socket: ${SOCKET.keyForFirebase} entered to ${params.room} chat room`);
                    SOCKET.join(params.room);

                    this.enterToPrivateChatRoom(params);
                    //
                    // if (params.user.keyForFirebase in allUsers) {
                    //     allUsers[params.user.keyForFirebase].emit('chat-room', {
                    //         from: params.from,
                    //         to: params.user,
                    //         room: params.room,
                    //         event: 'enter-to-chat-room',
                    //         date: Utils.now()
                    //     });
                    // } else {

                        this.sendNotification(params, 'enterToChatRoom')
                    // }
                }

            });

            SOCKET.on('join-to-chat-room', (params) => {

                if (params && socket) {
                    logger.debug(`Socket: ${SOCKET.keyForFirebase} joined to ${params.room} chat room`);
                    SOCKET.join(params.room);

                    this.enterToPrivateChatRoom(params);

                    if (params.user.keyForFirebase in allUsers) {
                        allUsers[params.user.keyForFirebase].emit('change-event-chat-room', {
                            from: params.from,
                            to: params.user,
                            room: params.room,
                            event: 'joined',
                            date: Utils.now()
                        });
                    }
                    // this.sendNotification(params, 'joinToChatRoom');
                }

            });

            SOCKET.on('left-from-chat-room', (params) => {

                if (params && socket) {
                    logger.debug(`Socket: ${SOCKET.keyForFirebase} left ${params.room} chat room`);
                    this.deleteFromPrivateChatRoom(params);

                    if (connectedUserInSpecificChatRoom[params.room]) {

                        if (params.user.keyForFirebase in connectedUserInSpecificChatRoom[params.room]) {

                            allUsers[params.user.keyForFirebase].emit('change-event-chat-room', {
                                from: params.from,
                                to: params.user,
                                room: params.room,
                                event: 'left',
                                date: Utils.now()
                            });
                            SOCKET.leave(params.room);
                        }
                    }
                }

            });

            SOCKET.on('add-message', (params) => {

                if (params && socket) {
                    logger.debug(`Socket: ${SOCKET.keyForFirebase} add message to ${params.room} chat room`);
                    IO.to(params.room).emit('message', {
                        text: params.message,
                        from: params.from.fullName,
                        room: params.room,
                        to: params.to,
                        date: Utils.now()
                    });
                    this.saveMessage(params);
                }

            });

            SOCKET.on('ask-to-join-private-room', (params) => {

                if (params && socket) {
                    logger.debug(`Socket: ${SOCKET.keyForFirebase} ask to join to ${params.user.communityName} community`);
                    // if (params.user.manager.id in allUsers) {
                    //
                    //     allUsers[params.user.manager.id].emit('user-ask-to-join-private-room', {
                    //         community: params.user, // == community obj
                    //         to: params.user.manager.name,
                    //         from: params.from,
                    //         room: params.user._id, // == community _id
                    //         event: 'user-ask-to-join-private-room',
                    //         communityName: params.user.communityName,
                    //         content: `Community name ${params.user.communityName}`,
                    //         date: Utils.now()
                    //     });
                    // } else {
                    //
                    //
                    // }

                    this.sendNotification(params, 'askToJoinPrivateRoom');
                }

            });

            SOCKET.on('decline-user-join-private-room', (params) => {

                if (params && socket) {
                    // if (params.from.keyForFirebase in allUsers) {
                    //
                    //     logger.debug(`Socket: ${SOCKET.keyForFirebase} decline ${params.from.fullName} user to join to ${params.communityName} community`);
                    //
                    //     allUsers[params.from.keyForFirebase].emit('user-ask-to-join-private-room', {
                    //         communityName: params.communityName,
                    //         to: params.to,
                    //         from: params.from,
                    //         event: 'manager-decline-user-join-private-room',
                    //         content: `Community name ${params.communityName}`,
                    //         date: Utils.now()
                    //     });
                    // } else {
                    //
                    //
                    // }
                    this.sendNotification(params, 'declineUserJoinPrivateRoom');
                }

            });

            SOCKET.on('claimed-activity', (params) => {
                if (params && socket) {
                    logger.debug(`Socket: ${SOCKET.keyForFirebase} claimed ${params.activity.activity_name}`);
                    if (params.to.id in allUsers) {

                        if (params.to.id in connectedUserInSpecificCommunity[params.community._id]) {
                            this.onClaimedActivity(params, 'on-claimed-activity', params.community._id);
                        } else {
                            this.onClaimedActivity(params, 'on-claimed-activity', params.community._id);
                            this.onClaimedActivity(params, 'on-claimed-activity-private', params.to.id);
                        }

                    } else {
                        this.onClaimedActivity(params, 'on-claimed-activity', params.community._id);
                    }
                    this.sendNotification(params, 'onClaimedActivity');
                }
            });

            SOCKET.on('decline-activity', (params) => {
                if (params && socket) {
                    logger.debug(`Socket: ${SOCKET.keyForFirebase} Decline ${params.activity.activity_name}`);
                    if (params.to.id in allUsers) {

                        if (params.to.id in connectedUserInSpecificCommunity[params.community._id]) {
                            this.onDeclineActivity(params, 'on-decline-activity', params.community._id);
                        } else {
                            this.onDeclineActivity(params, 'on-decline-activity', params.community._id);
                            this.onDeclineActivity(params, 'on-decline-activity-private', params.to.id);
                        }

                    } else {
                        this.onDeclineActivity(params, 'on-decline-activity', params.community._id);
                    }
                    this.sendNotification(params, 'onDeclineActivity');
                }
            });

            SOCKET.on('approve-activity', (params) => {
                if (params && socket) {
                    logger.debug(`Socket: ${SOCKET.keyForFirebase} approve ${params.activity.activity_name} to ${params.to.fullName}`);
                    if (params.to.user_id in allUsers) {

                        if (params.to.user_id in connectedUserInSpecificCommunity[params.community._id]) {
                            this.onApproveActivity(params, 'on-approve-activity', params.community._id);
                        } else {
                            this.onApproveActivity(params, 'on-approve-activity', params.community._id);
                            this.onApproveActivity(params, 'on-approve-activity-private', params.to.user_id);
                        }

                    } else {
                        this.onApproveActivity(params, 'on-approve-activity', params.community._id);
                    }
                    this.sendNotification(params, 'onApproveActivity');
                }
            });

        }
    );
};

// socket functions

exports.addUserToAllUsers = (socket, params) => {
    SOCKET.keyForFirebase = params.keyForFirebase;
    if (SOCKET.keyForFirebase in allUsers) {

    } else {

        allUsers[SOCKET.keyForFirebase] = socket;
    }
};

exports.deleteUserFromAllUsers = (keyForFirebase) => {
    delete allUsers[keyForFirebase];
};

exports.addUserToConnectedUserInSpecificCommunity = (params, socket) => {
    roomKey[SOCKET.keyForFirebase] = socket;
    connectedUserInSpecificCommunity[params.room] = roomKey;
};

exports.deleteUserFromConnectedUserInSpecificCommunity = (params, keyForFirebase) => {

    if (params.room in connectedUserInSpecificCommunity &&
        SOCKET.keyForFirebase in connectedUserInSpecificCommunity[params.room]) {

        delete connectedUserInSpecificCommunity[params.room][keyForFirebase];
    }
};

exports.enterToPrivateChatRoom = (params) => {
    roomKey[SOCKET.keyForFirebase] = SOCKET;
    connectedUserInSpecificChatRoom[params.room] = roomKey;
};

exports.deleteFromPrivateChatRoom = (params) => {
    if (params.room in connectedUserInSpecificChatRoom &&
        SOCKET.keyForFirebase in connectedUserInSpecificChatRoom[params.room]) {

        delete connectedUserInSpecificChatRoom[params.room][SOCKET.keyForFirebase];
    }
};

exports.privateDeleteFromCommunity = (keyForFirebase, params) => {
    allUsers[keyForFirebase].emit('members-changed-private', {
        from: params.from,
        communityName: params.roomName,
        user: params.user,
        communityId: params.roomId,
        event: 'deleted',
        date: Utils.now()
    });
};

exports.deleteFromCommunity = (params, event) => {
    IO.to(params.room).emit('members-changed', {
        from: params.from || params.user,
        communityName: params.roomName,
        user: params.user,
        communityId: params.roomId,
        event: event,
        date: Utils.now()
    });
};

exports.privateAddToCommunity = (keyForFirebase, params) => {
    allUsers[keyForFirebase].emit('members-changed-private', {
        from: params.from,
        communityName: params.roomName,
        user: params.user,
        communityId: params.roomId,
        event: 'joined',
        date: Utils.now()
    });
};

exports.addToCommunity = (params) => {
    IO.to(params.room).emit('members-changed', {
        from: params.user,
        communityName: params.roomName,
        user: params.user,
        communityId: params.roomId,
        event: 'joined',
        date: Utils.now()
    });
};

exports.saveMessage = (params) => {


    let msgObj = new MESSAGE({
        from: params.from.fullName,
        date: Utils.now(),
        room: params.room,
        text: params.message
    });

    messageService.saveNewMessage(msgObj)
};


exports.onClaimedActivity = (params, type, to) => {


    if (type === 'on-claimed-activity') {

        IO.to(to).emit(type, {
            activity: params.activity,
            to: params.to,
            from: params.from,
            event: 'user-ask-to-claimed-activity',
            content: `Activity name ${params.activity.activity_name}`,
            date: Utils.now()
        });
    } else {
        allUsers[to].emit(type, {
            activity: params.activity,
            to: params.to,
            from: params.from,
            event: 'user-ask-to-claimed-activity',
            content: `Activity name ${params.activity.activity_name}`,
            date: Utils.now()
        });
    }
};

exports.onDeclineActivity = (params, type, to) => {

    if (type === 'on-decline-activity') {

        IO.to(to).emit(type, {
            activity: params.activity,
            to: params.to,
            from: params.from,
            event: 'user-decline-activity',
            content: `Activity name ${params.activity.activity_name}`,
            date: Utils.now()
        });
    } else {
        allUsers[to].emit(type, {
            activity: params.activity,
            to: params.to,
            from: params.from,
            event: 'user-decline-activity',
            content: `Activity name ${params.activity.activity_name}`,
            date: Utils.now()
        });
    }
};

exports.onApproveActivity = (params, type, to) => {

    if (type === 'on-approve-activity') {

        IO.to(to).emit(type, {
            activity: params.activity,
            to: params.to,
            from: params.from,
            event: 'user-approve-activity',
            content: `Activity name ${params.activity.activity_name}`,
            date: Utils.now()
        });
    } else {
        allUsers[to].emit(type, {
            activity: params.activity,
            to: params.to,
            from: params.from,
            event: 'user-approve-activity',
            content: `Activity name ${params.activity.activity_name}`,
            date: Utils.now()
        });
    }
};

exports.sendSocketNotification = (notification) => {

    allUsers[notification.to.keyForFirebase].emit('notification',
        notification
    );
};

exports.sendNotification = (params, type) => {
    let from = {

        fullName: params.from ? params.from.fullName : '',
        keyForFirebase: SOCKET.keyForFirebase,
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
            creation_date: Utils.now(),
            communityName: params.roomName,
            event: 'add-to-community-by-manager',
            content: `${from.fullName} added you to ${params.roomName} community`,
        });
    } else if (type === 'deleteByManager') {
        notificationObj = new NOTIFICATION({
            from: from,
            to: to,
            room: params.roomId,
            status: 'unread',
            creation_date: Utils.now(),
            event: 'deleted-by-manager',
            content: `${from.fullName} deleted you from ${params.roomName} community`,
        });
    } else if (type === 'onDeleteCommunity') {
        notificationObj = new NOTIFICATION({
            from: from,
            to: to,
            room: params.roomId,
            status: 'unread',
            creation_date: Utils.now(),
            event: 'delete-community',
            content: `${from.fullName} deleted ${params.community.communityName} permanently`,
        });
    } else if (type === 'enterToChatRoom') {
        notificationObj = new NOTIFICATION({
            from: from,
            to: to,
            room: params.room,
            status: 'unread',
            creation_date: Utils.now(),
            event: 'enter-to-chat-room',
            content: `Chat invitation received from ${from.fullName}`,
        });
    } else if (type === 'joinToChatRoom') {
        notificationObj = new NOTIFICATION({
            from: from,
            to: to,
            room: params.room,
            status: 'unread',
            creation_date: Utils.now(),
            event: 'join-to-chat-room',
            content: `Chat invitation received from ${from.fullName}`,
        });
    } else if (type === 'askToJoinPrivateRoom') {

        from.keyForFirebase = params.from.keyForFirebase;
        to.fullName = params.user.manager.name;
        to.keyForFirebase = params.user.manager.id;

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

        from.keyForFirebase = params.to.keyForFirebase;
        from.fullName = params.to.fullName;

        to.keyForFirebase = params.from.keyForFirebase;
        to.fullName = params.from.fullName;

        notificationObj = new NOTIFICATION({
            from: from,
            to: to,
            status: 'unread',
            creation_date: Utils.now(),
            event: 'manager-decline-user-join-private-room',
            communityName: params.communityName,
            content: `Community ${params.communityName}`,
        });
    } else if (type === 'onClaimedActivity') {

        to.fullName = params.to.name;
        to.keyForFirebase = params.to.id;

        notificationObj = new NOTIFICATION({
            from: from,
            to: to,
            status: 'unread',
            creation_date: Utils.now(),
            event: 'user-ask-to-claimed-activity',
            communityName: params.activity,
            content: `Activity ${params.activity.activity_name}`,
        });
    } else if (type === 'onApproveActivity') {

        to.fullName = params.to.fullName;
        to.keyForFirebase = params.to.user_id;

        notificationObj = new NOTIFICATION({
            from: from,
            to: to,
            status: 'unread',
            creation_date: Utils.now(),
            event: 'user-approve-activity',
            communityName: params.activity,
            content: `Activity ${params.activity.activity_name}`,
        });
    } else if (type === 'onDeclineActivity') {

        to.fullName = params.to.fullName;
        to.keyForFirebase = params.to.user_id;

        notificationObj = new NOTIFICATION({
            from: from,
            to: to,
            status: 'unread',
            creation_date: Utils.now(),
            event: 'user-decline-activity',
            communityName: params.activity,
            content: `Activity ${params.activity.activity_name}`,
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
            creation_date: Utils.now(),
            event: 'activity-is-about-to-start',
            communityName: params, //activity
            content: `Activity ${params.activity_name} is about to start`,
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
            creation_date: Utils.now(),
            event: 'activity-is-about-to-start',
            communityName: params, //activity
            content: `Activity ${params.activity_name} is about to start`,
        });
    }

    if (to.keyForFirebase in allUsers) {
        this.sendSocketNotification(notificationObj)
    }
    else {
        notificationService.saveNewNotification(notificationObj)
    }
};
