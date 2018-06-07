const mongoose = require('mongoose'),
    Utils = require('../utils'),
    schema = mongoose.Schema,

    message = new schema({

        from: String,
        date: {type: Number, default: Utils.getUnixTime},
        room: String,
        text: String

    }, {strict: true});


let Message = mongoose.model('Message', message);

module.exports = Message;
