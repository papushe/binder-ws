const mongoose = require('mongoose'),
    schema = mongoose.Schema,

    message = new schema({
        from: String,
        to: String,
        room: String,
        status: String,
        creation_date: String,
        content: String
    }, {strict: true});


let Message = mongoose.model('Message', message);

module.exports = Message;
