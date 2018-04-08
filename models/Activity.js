const mongoose = require('mongoose'),
      schema   = mongoose.Schema,

    activity = new schema({
        activity_name: String,
        activity_description: String,
        type: String,
        created_at: String,
        consumer_id: String,
        provider_id: String,
        community_id: String,
        source: String,
        destination: String,
        activity_date: String,
        notes: String
    },{strict: true});


let Activity = mongoose.model('Activity', activity);

module.exports = Activity;
