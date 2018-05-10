const mongoose = require('mongoose'),
    schema = mongoose.Schema,

    message = new schema({
            roomId: String,
            massages: [
                {
                    from: String,
                    date: String,
                    roomId: String,
                    content: String
                }
            ]
    }, {strict: true});


let Message = mongoose.model('Message', message);

module.exports = Message;
