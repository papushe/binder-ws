const mongoose = require('mongoose'),
      schema   = mongoose.Schema,

    job = new schema({
        activity_id: String,
        status: String,
        created_at: String,
        consumer: {
            name: String,
            id: String
        },
        provider: {
            name: String,
            id: String
        },
        execution_date: String,
    },{strict: true});


let Job = mongoose.model('Job', job);

module.exports = Job;
