const mongoose = require('mongoose'),
    schema = mongoose.Schema,
    user = new schema({
            firstName: String,
            lastName: String,
            location: String,
            email: String,
            phoneNumber: String,
            dateOfBirth: String,
            creationDate: String,
            type: String,
            communities: [{
                communityId: String,
                role: String,
            }],
            votes: {
                up: {type: Number, default: 0},
                down: {type: Number, default: 0}
            },
            skills: [String],
            description: String,
            profilePic: String,
            keyForFirebase: String
        },
        {toObject: {virtuals: true}},
        {toJSON: {virtuals: true}},
        {strict: true}
    );

'use strict';


user.virtual('rank').get(function () {
    if (this.votes.up + this.votes.down !== 0) {
        return Math.round(5 * (this.votes.up / (this.votes.up + this.votes.down)));
    }
    else {
        return -1;
    }
});
user.virtual('fullName').get(function () {
    return this.firstName + ' ' + this.lastName
});

let User = mongoose.model('User', user);

module.exports = User;
