let USER = require('../models/User');

const ROLE_MANAGER = 'Manager';
const ROLE_AUTHORIZED = 'authorizedMember';
const ROLE_MEMBER = 'Member';

exports.getRole = (role) => {
    if (role.match(new RegExp(ROLE_MANAGER, "ig"))) {
        console.log('manager role!');
        return ROLE_MANAGER;
    }

    if (role.match(new RegExp(ROLE_AUTHORIZED, "ig"))) {
        console.log('authorized role!');
        return ROLE_AUTHORIZED;
    }

    if (role.match(new RegExp(ROLE_MEMBER, "ig"))) {
        console.log('member role!');
        return ROLE_MEMBER;
    }
    return null;
};

exports.updateUserRole = (userId, communityId, role) => {
    USER.updateOne(
        {
            keyForFirebase: userId,
            communities: {$elemMatch: {communityId: {$eq: communityId}}}
        },
        {$set: {"communities.$.role": role}},
        (err, data) => {
            if (err) {
                console.log(err);
                throw (err);
            }
            console.log(data)
        })
};
exports.removeCommunityFromUser = (userId, communityId) => {
    USER.findOneAndUpdate(
        {keyForFirebase: {$eq: userId}},
        {$pull: {communities: {communityId: communityId}}},
        (err, data) => {
            if (err) {
                console.log(`error occurred while removing user community: ${communityId} from communities list: ${err}`);
                throw (err);
            }
            console.log(`community: ${communityId} was removed from communities list for user: ${userId}`);
        });
};

exports.addCommunityToUser = (userId, newCommunity) => {
    USER.findOne({keyForFirebase: {$eq: userId}},
        (err, data) => {
            if (err) {
                console.log(`error occurred while trying add user community: ${newCommunity.communityId} to communities list: ${err}`);
                res.json(false);
                return;
            }

            if (data == null || data.communities == null) {
                console.log(`error occurred while trying add user: ${userId} to community: ${newCommunity.communityId}: ${err}`);
                res.json(false);
                return;
            }

            data.communities.push(newCommunity);
            data.save((err, data) => {
                if (err) {
                    console.log(`error occurred while trying add user community: ${newCommunity.communityId} to communities list: ${err}`);
                    res.json(false);
                }
                console.log(`community: ${newCommunity.communityId} was added to communities list for user: ${userId}`);
            });

        });
};


