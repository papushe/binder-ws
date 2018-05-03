module.exports = (io) => {
    let allUsers = {},
        roomKey = {},
        connectedUserInSpecificCommunity = {};

    io.on('connection', (socket) => {

        socket.on('disconnect', function () {

            deleteUserFromAllUsers(socket.nickname);

            io.emit('users-changed', {
                user: socket.nickname,
                event: 'left',
                date: new Date()
            });
        });

        socket.on('set-nickname', (nickname) => {

            addUserToAllUsers(socket, nickname);

            io.emit('users-changed', {
                user: nickname,
                event: 'joined',
                date: new Date()
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
                date: new Date()
            });
        });

        socket.on('left-community', (params) => {

            if (params.room in connectedUserInSpecificCommunity &&
                socket.nickname in connectedUserInSpecificCommunity[params.room]) {

                deleteUserFromConnectedUserInSpecificCommunity(params, socket.nickname);
            }

            io.to(params.room).emit('members-changed', {
                from: socket.nickname,
                communityName: params.roomName,
                communityId: params.roomId,
                event: 'left',
                date: new Date()
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
            }
            addToCommunity(params);
        });

        socket.on('delete-from-community', (params) => {
            let userName = params.user.firstName + ' ' + params.user.lastName;
            if (userName in connectedUserInSpecificCommunity[params.room]) {

                deleteUserFromConnectedUserInSpecificCommunity(params, userName);

                deleteFromCommunity(params);

                socket.leave(params.room);

            } else {

                privateDeleteFromCommunity(userName, params);

                deleteFromCommunity(params);

            }
        });

        socket.on('add-activity', (params) => {
            io.to(params.room).emit('new-add-activity', {
                activity: params.activity,
                from: socket.nickname,
                communityId: params.communityId,
                room: params.communityId,
                date: new Date()
            });
        });

        socket.on('enter-to-chat-room', (params) => {
            socket.join(params.room);
            if (allUsers[params.to.fullName]) {
                allUsers[params.to.fullName].emit('chat-room', {
                    from: params.from,
                    to: params.to,
                    room: params.room,
                    event: 'enter-to-chat-room',
                    date: new Date()
                });
            } else {
                //user 'to' not connected to the app
            }
        });

        socket.on('join-to-chat-room', (params) => {
            socket.join(params.room);
            if (allUsers[params.to.fullName]) {
                allUsers[params.to.fullName].emit('change-event-chat-room', {
                    from: params.from,
                    to: params.to,
                    room: params.room,
                    event: 'joined',
                    date: new Date()
                });
            }
        });

        socket.on('left-from-chat-room', (params) => {
            if (allUsers[params.to.fullName]) {
                allUsers[params.to.fullName].emit('change-event-chat-room', {
                    from: params.from,
                    to: params.to,
                    room: params.room,
                    event: 'left',
                    date: new Date()
                });
                socket.leave(params.room);
            }
        });

        socket.on('add-message', (message) => {

            io.emit('message', {
                text: message.text,
                from: socket.nickname,
                date: new Date()
            });
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
            delete connectedUserInSpecificCommunity[params.room][userName];
        }

        function privateDeleteFromCommunity(userName, params) {
            allUsers[userName].emit('members-changed-private', {
                from: socket.nickname,
                communityName: params.roomName,
                user: params.user,
                communityId: params.roomId,
                event: 'deleted',
                date: new Date()
            });
        }

        function deleteFromCommunity(params) {
            io.to(params.room).emit('members-changed', {
                from: socket.nickname,
                communityName: params.roomName,
                user: params.user,
                communityId: params.roomId,
                event: 'deleted',
                date: new Date()
            });
        }

        function privateAddToCommunity(userName, params) {
            allUsers[userName].emit('members-changed-private', {
                from: socket.nickname,
                communityName: params.roomName,
                user: params.user,
                communityId: params.roomId,
                event: 'joined',
                date: new Date()
            });
        }

        function addToCommunity(params) {
            io.to(params.room).emit('members-changed', {
                from: socket.nickname,
                communityName: params.roomName,
                user: params.user,
                communityId: params.roomId,
                event: 'joined',
                date: new Date()
            });
        }

    });
};