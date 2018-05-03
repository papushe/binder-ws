const mongoose = require('mongoose'),
    schema = mongoose.Schema,

    notification = new schema({
        from: {
            name: String,
            id: String
        },
        to: {
            name: String,
            id: String
        },
        room: String,
        status: String,
        creation_date: String,
        event: String,
        content: String
    }, {strict: true});


let Notification = mongoose.model('Notification', notification);

module.exports = Notification;