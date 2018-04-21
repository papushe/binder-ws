module.exports = (io) => {
    io.on('connection', (socket) => {

        socket.on('disconnect', function () {
            io.emit('users-changed', {
                user: socket.nickname,
                event: 'left'
            });
        });

        socket.on('set-nickname', (nickname) => {
            socket.nickname = nickname;
            io.emit('users-changed', {
                user: nickname,
                event: 'joined'
            });
        });

        socket.on('join-community', (params) => {
            socket.join(params.room);
            io.to(params.room).emit('members-changed', {
                from: socket.nickname,
                communityName: params.roomName,
                event: 'joined'
            });
        });

        socket.on('left-community', (params)=>{
            io.to(params.room).emit('members-changed', {
                from: socket.nickname,
                communityName: params.roomName,
                event:'left'
            });
            socket.leave(params.room);
        });


        socket.on('add-activity', (message) => {
            io.to(message.room).emit('new-add-activity', {
                activity: message.activity,
                from: socket.nickname,
                communityId: message.communityId,
                room: message.communityId,
                created: new Date()
            });
        });


        socket.on('add-message', (message) => {
            io.emit('message', {
                text: message.text,
                from: socket.nickname,
                created: new Date()
            });
        });
    });
};