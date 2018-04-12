let COMMUNITY = require('../models/Community');
let userService = require('./userService');

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

exports.deleteCommunityById = (communityId) => {
    COMMUNITY.findOneAndRemove({_id: {$eq: communityId}}, (err) => {
        if (err) {
            console.log(`error occurred when tried to delete community: ${communityId}`);
            res.json(false);
        }
        else {
            console.log(`community: ${communityId} was deleted`);
        }
    });
};

exports.setAsAuthorizedMember = (communityId, userId) => {
    COMMUNITY.findOneAndUpdate({_id: {$eq: communityId}},
        (err, data) => {
            if (err) {
                throw(`error occurred while trying set user: ${userId} as authorized member in community: ${communityId}: ${err}`);
            }

            if (data && data._doc) {
                if(data._doc.managerId == userId)
                {
                    this.setNewManager(communityId, userId);
                }

                data._doc.authorizedMembers.push({memberId: userId});
                data.save((err, data) => {
                    if (err) {
                        throw(`error occurred while trying set user: ${userId} as authorized member in community: ${communityId}: ${err}`);
                    }
                    console.log(`user ${userId} is now an authorized member in community: ${communityId}`);
                });
            }
            else {
                throw(`error occurred while trying set user: ${userId} as authorized member in community: ${communityId}: data is undefined!`);
            }
        });
};

exports.setAsMember = (communityId, userId) => {
    COMMUNITY.findOneAndUpdate({_id: {$eq: communityId}},
        {$pull: {authorizedMembers: {memberId: userId}}},
        (err, data) => {
            if (err) {
                throw(`error occurred while trying set user: ${userId} as a member in community: ${communityId}: ${err}`);
            }

            if (data && data._doc) {
                if(data._doc.managerId == userId)
                {
                    this.setNewManager(communityId, userId);
                }
            console.log(`user ${userId} is now a member in ${communityId}`);
         }
            else {
                 throw(`error occurred while trying set user: ${userId} as member in community: ${communityId}: data is undefined!`);
            }
    });
};

exports.setNewManager = (communityId, userId) => {
    let oldManagerId;
    let newManagerId;

    COMMUNITY.findOneAndUpdate({_id: {$eq: communityId}},
        (err, data) => {
            if (err) {
                throw(`error occurred while trying set a new manager in community: ${communityId}: ${err}`);
            }

            if (data && data._doc) {
                oldManagerId = data._doc.managerId;
                newManagerId = userId || this.getNextNewManagerId(data.toObject());
                data.set({
                    managerId: newManagerId
                });

                userService.updateUserRole(newManagerId, communityId, 'Manager');
                userService.updateUserRole(oldManagerId, communityId, 'Member');

                console.log(`user ${newManagerId} is now a manager in ${communityId}`);
            }
            else {
                throw(`error occurred while trying set a new manager in community: ${communityId}: data is undefined!`);
            }
        });
};

