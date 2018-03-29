let USER = require('../models/User');

exports.updateUserRole = (userId, communityId, role) => {
    USER.updateOne(
        {
            keyForFirebase: userId,
            communities:{$elemMatch:{communityId:{$eq:communityId}}}
        },
        { $set: { "communities.$.role" : role } },
        (err, data) => {
            if (err) {
                console.log(err);
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
            }
            console.log(`community: ${communityId} was removed from communities list for user: ${userId}`);
        });
};


