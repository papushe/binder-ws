let COMMUNITY = require('../models/Community');

exports.getNextNewManagerId = (community) => {
    let newManagerId = null;

    if (community.authorizedMembers.length > 0) {
        community.authorizedMembers.forEach(authMember => {
            if (authMember.memberId != community.managerId) {
                newManagerId = authMember.memberId;
            }
        })
    }
    if (community.members.length > 0) {
        community.members.forEach(member => {
            if (member.memberId != community.managerId) {
                newManagerId = member.memberId;
            }
        })
    }
    return newManagerId;
};


