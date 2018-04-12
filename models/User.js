'use strict';
const mongoose = require('mongoose'),
    schema   = mongoose.Schema,
    user = new schema({
        firstName: String,
        lastName: String,
        location: String,
        email: String,
        phoneNumber: String,
        dateOfBirth: String,
        creationDate: String,
        type: String,
        communities:[{
            communityId:String,
            role:String,
        }],
        rank:String,
        skills:[String],
        description:String,
        profilePic:String,
        keyForFirebase:String
    },{strict: true});

let User = mongoose.model('User', user);

module.exports = User;
