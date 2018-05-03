const mongoose = require('mongoose'),
    schema = mongoose.Schema,

    message = new schema({
        from: {
            name: String,
            id: String
        },
        to: {
            name: String,
            id: String
        },
        status: String,
        creation_date: String,
        content: String
    }, {strict: true});


let Message = mongoose.model('Message', message);

module.exports = Message;
