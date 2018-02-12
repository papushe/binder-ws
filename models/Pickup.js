const mongoose = require('mongoose'),
      schema   = mongoose.Schema,

    pickup = new schema({
        pickupName: String,
        pickupDescription: String,
        type: String,
        consumerId: String,
        providerId: String,
        source: [{
            city:String,
            address:String,
            building:String,
        }],
        destination: [{
            city:String,
            address:String,
            building:String,
        }],
        dateTime: String,
        notes: String
    },{strict: true});


let Pickup = mongoose.model('Pickup', pickup);

module.exports = Pickup;
