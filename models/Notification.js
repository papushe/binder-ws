const mongoose = require('mongoose'),
    schema = mongoose.Schema,

    notification = new schema({
        from: {
            fullName: String,
            keyForFirebase: String,
            profilePic: String
        },
        to: {
            fullName: String,
            keyForFirebase: String,
            profilePic: String
        },
        room: String,
        communityName: String,
        activity: {},
        status: String,
        creation_date: String,
        event: String,
        content: String,
        user: {},
        isAddToCalender: Boolean
    }, {strict: true});


let Notification = mongoose.model('Notification', notification);

module.exports = Notification;
