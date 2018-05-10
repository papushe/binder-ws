const mongoose = require('mongoose'),
    schema = mongoose.Schema,

    community = new schema({
        communityName: String,
        communityDescription: String,
        creationDate: String,
        managerId: String,
        managerName: String,
        authorizedMembers: [{
            memberId: String
        }],
        members: [{
            memberId: String
        }],
        waiting_list: [],
        type: String
    }, {strict: true});


let Community = mongoose.model('Community', community);

module.exports = Community;