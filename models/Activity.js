const mongoose = require('mongoose'),
    Utils = require('../utils'),
    schema = mongoose.Schema,

    activity = new schema({
        activity_name: String,
        activity_description: String,
        created_at: {type: Number, default: Utils.getUnixTime},
        recurring: {type: String, default: `once`},
        consumer: {
            name: String,
            id: String
        },
        provider: {
            name: String,
            id: String
        },
        community_id: String,
        status: {
            value: String, //'open', 'claimed', 'approved', 'live', 'done', 'ongoing', 'cancelled'
            user_id: String,
            fullName: String
        },
        source: String,
        destination: String,
        activity_date: Number,
        notes: String,
        isVote: Boolean
    }, {strict: true});


let Activity = mongoose.model('Activity', activity);

module.exports = Activity;
