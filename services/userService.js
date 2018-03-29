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


