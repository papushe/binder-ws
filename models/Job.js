const mongoose = require('mongoose'),
    schema = mongoose.Schema,

    job = new schema({
        activity_id: String,
        status: String,  // 'pending', 'done'
        created_at: Number,
        consumer: {
            name: String,
            id: String
        },
        provider: {
            name: String,
            id: String
        },
        recurring: String,
        execution_time: {
            first: Number,
            next: Number,
        },
    }, {strict: true});

let Job = mongoose.model('Job', job);

module.exports = Job;
