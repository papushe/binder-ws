const mongoose = require('mongoose'),
    Utils = require('../utils'),
    schema = mongoose.Schema,

    community = new schema({
        communityName: String,
        communityDescription: String,
        creationDate: {type: Number, default: Utils.getUnixTime},
        manager: {
            id: String,
            name: String,
        },
        members: [{
            memberId: String
        }],
        waiting_list: [],
        type: String
    }, {strict: true});


let Community = mongoose.model('Community', community);

module.exports = Community;