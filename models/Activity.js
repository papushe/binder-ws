const mongoose = require('mongoose'),
      schema   = mongoose.Schema,

    activity = new schema({
        activity_name: String,
        activity_description: String,
        created_at: String,
        recurring: {type: String, default: `daily`},
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
            value: String,
            user_id: String,
            fullName: String
        },
        source: String,
        destination: String,
        activity_date: Number,
        notes: String
    },{strict: true});


let Activity = mongoose.model('Activity', activity);

module.exports = Activity;
