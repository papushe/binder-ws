let USER = require('../models/User');

exports.updateUserRole = (userId, communityId) => {

    USER.updateOne(
        {
            keyForFirebase: userId,
            communities:{$elemMatch:{communityId:{$eq:communityId}}}
        },
        { $set: { "communities.$.role" : 'Manager' } },
        (err, data) => {
            if (err) {
                // res.json(err);
                console.log(err);
            }
            console.log(data)
        })
};


