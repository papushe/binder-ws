const mongoose = require('mongoose'),
    schema = mongoose.Schema,

    notification = new schema({
        from: {
            fullName: String,
            id: String
        },
        to: {
            fullName: String,
            id: String
        },
        room: String,
        communityName: String,
        status: String,
        creation_date: String,
        event: String,
        content: String
    }, {strict: true});


let Notification = mongoose.model('Notification', notification);

module.exports = Notification;
