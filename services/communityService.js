let COMMUNITY = require('../models/Community');

exports.getNextNewManagerId = (community) => {

    if (community.authorizedMembers.length > 0) {
        community.authorizedMembers.forEach(authMember => {
            if (authMember.memberId != community.managerId) {
                return authMember.memberId;
            }
        })
    }
    if (community.members.length > 0) {
        community.members.forEach(member => {
            if (member.memberId != community.managerId) {
                return member.memberId;
            }
        })
    }
};


