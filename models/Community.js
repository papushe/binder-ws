const mongoose = require('mongoose'),
      schema   = mongoose.Schema,

    community = new schema({
        communityName: String,
        communityDescription: String,
        creationDate: String,
        classification: String,
        managerId: String,
        authorizedMembers: [{
            memberId:String
        }],
        members: [{
            memberId:String
        }],
        type: String
    },{strict: true});


let Community = mongoose.model('Community', community);

module.exports = Community;