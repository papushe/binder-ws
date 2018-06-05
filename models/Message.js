const mongoose = require('mongoose'),
    schema = mongoose.Schema,

    message = new schema({

        from: String,
        date: {type: Number, default: new Date().getTime()},
        room: String,
        text: String

    }, {strict: true});


let Message = mongoose.model('Message', message);

module.exports = Message;
