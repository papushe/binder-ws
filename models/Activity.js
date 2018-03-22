const mongoose = require('mongoose'),
      schema   = mongoose.Schema,

    pickup = new schema({
        activity_id: String,
        activity_name: String,
        activity_description: String,
        type: String,
        created_at: Date,
        consumer_id: String,
        provider_id: String,
        source: [{
            city: String,
            street: String,
            number: String,
        }],
        destination: [{
            city: String,
            street: String,
            number: String,
        }],
        activity_date: Date,
        notes: String
    },{strict: true});


let Pickup = mongoose.model('Pickup', pickup);

module.exports = Pickup;
