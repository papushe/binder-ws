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


