let USER = require('../models/User'),
    Promise = require('promise'),
    Utils = require('../utils'),
    logger = Utils.getLogger();


// const ROLE_AUTHORIZED = 'authorizedMember',
      const ROLE_MEMBER = 'Member';

// exports.getRole = (role) => {
//     return (role.match(new RegExp('auth', "ig"))) ? ROLE_AUTHORIZED : ROLE_MEMBER;
// };

exports.rankUser = (vote) => {
    return new Promise((resolve, reject) => {
        USER.findOne({keyForFirebase: {$eq: vote.userId}},
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to rate user: ${vote.userId} due to: ${err}`);
                    reject(false);
                }
                if (vote.up) {
                    data._doc.votes.up += 1;
                }
                else if (vote.down) {
                    data._doc.votes.down += 1;
                }
                data.set({
                    "votes.up": (vote.up) ? data.votes.up ++ : data.votes.up,
                    "votes.down": (vote.down) ? data.votes.down ++ : data.votes.down
                });
                data.save(
                    (err, data) => {
                        if (err || !data) {
                            logger.error(`failed to rank user: ${vote.userId} due to: ${err}`);
                            reject(false);
                        }
                        logger.info(`user: ${vote.userId} rank was updated`);
                        resolve(data);
                    }
                );
            });
    });
};

exports.saveNewUser = (newUser) => {
    return new Promise((resolve, reject) => {
        newUser.save((err, data) => {
                if (err || !data) {
                    logger.error(`failed to create user: ${newUser} due to: ${err}`);
                    reject(false);
                }
            logger.info(`new user: ${newUser._id} was created`);
                resolve(true);
            }
        );
    });

};

exports.getUserProfile = (userId) => {
    return new Promise((resolve, reject) => {
        USER.findOne({keyForFirebase: {$eq: userId}},
            (err, data) => {
                if (err) {
                    logger.error(`failed to get user: ${userId} profile due to: ${err}`);
                    reject(false);
                }
                if (!data) {
                    logger.warn(`cannot find user: ${userId} profile due to: not exist!`);
                    resolve([]);
                }
                else {
                    resolve(data);
                }
            });
    });
};

exports.updateUserProfile = (profileObj) => {
    return new Promise((resolve, reject) => {
        USER.findOne({keyForFirebase: {$eq: profileObj.keyForFirebase}},
            (err, data) => {
                if (err) {
                    logger.error(`failed to find user: ${profileObj.keyForFirebase} profile due to: ${err}`);
                    reject(false);
                }
                else if (!data) {
                    logger.info(`user: ${profileObj.keyForFirebase} profile not exist! creating new one...`);
                    let newUser = new USER({
                        firstName: profileObj.firstName,
                        lastName: profileObj.lastName,
                        location: profileObj.location,
                        email: profileObj.email,
                        phoneNumber: profileObj.phoneNumber || '',
                        dateOfBirth: profileObj.dateOfBirth || '',
                        creationDate: Utils.now(),
                        skills: profileObj.skills || '',
                        description: profileObj.description || '',
                        profilePic: profileObj.profilePic || '',
                        keyForFirebase: profileObj.keyForFirebase,
                    });

                    this.saveNewUser(newUser)
                        .then(response => {
                            resolve(response);
                        })
                        .catch(err => {
                            reject(false);
                        });
                 }
                else if (data) {
                    data.set({
                        keyForFirebase: profileObj.keyForFirebase,
                        firstName: profileObj.firstName || '',
                        lastName: profileObj.lastName || '',
                        location: profileObj.location || '',
                        phoneNumber: profileObj.phoneNumber || '',
                        dateOfBirth: profileObj.dateOfBirth || '',
                        skills: profileObj.skills || '',
                        description: profileObj.description || '',
                        profilePic: profileObj.profilePic || ''
                    });
                    data.save(
                        (err, data) => {
                            if (err || !data) {
                                logger.error(`failed to save user: ${profileObj.keyForFirebase} profile due to: ${err}`);
                                reject(false);
                            }
                            logger.info(`user: ${profileObj.keyForFirebase} profile was updated`);
                            resolve(data);
                        }
                    );
                }
            })
    });
};

exports.updateUserRole = (userId, communityId, role) => {
    return new Promise((resolve, reject) => {
        USER.updateOne(
            {
                keyForFirebase: userId,
                communities: {$elemMatch: {communityId: {$eq: communityId}}}
            },
            {$set: {"communities.$.role": role}},
            (err, data) => {
                if (err || !data) {
                    logger.info(err);
                    reject(err);
                }
                logger.info(`role was updated to: ${role} to user: ${userId} in community: ${communityId}`);
                resolve(true);
            })
    });
};

exports.removeCommunityFromUser = (userId, communityId) => {
    return new Promise((resolve, reject) => {
        USER.findOneAndUpdate(
            {keyForFirebase: {$eq: userId}},
            {$pull: {communities: {communityId: communityId}}},
            {new: true},
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to remove user community: ${communityId} from user: ${userId} communities list due to: ${err}`);
                    reject(false);
                }
                logger.info(`community: ${communityId} was removed from communities list for user: ${userId}`);
                resolve(data);
            });
    });
};

exports.addCommunityToUser = (userId, newCommunity) => {
    return new Promise((resolve, reject) => {
        USER.findOne({keyForFirebase: {$eq: userId}},
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to add user community: ${newCommunity.communityId} to communities list due to: ${err}`);
                    reject(false);
                }
                data.communities.push(newCommunity);
                data.save((err, data) => {
                    if (err || !data) {
                        logger.info(`error occurred while trying add user community: ${newCommunity.communityId} to communities list: ${err}`);
                        reject(false);
                    }
                    logger.info(`community: ${newCommunity.communityId} was added to communities list for user: ${userId}`);
                    resolve(data);
                });
            });
    });
};

exports.deleteUser = (userId) => {
    return new Promise((resolve, reject) => {
        USER.findOneAndRemove({keyForFirebase: {$eq: userId}},
            (err, data) => {
                if (err) {
                    logger.error(`failed to delete user: ${userId} due to: ${err}`);
                    reject(false);
                }
                if (!data) {
                    logger.warn(`cannot delete user: ${userId} due to: not existed!`);
                    resolve(true);
                }
                logger.info(`user: ${userId} was deleted!`);
                resolve(true);
            });
    });
};

exports.searchUsers = (query) => {
    return new Promise((resolve, reject) => {
        USER.find(
            {
                $or:
                    [
                        {firstName: {$regex: query, $options: "i"}},
                        {lastName: {$regex: query, $options: "i"}}
                    ]
            },
            (err, data) => {
                if (err || !data) {
                    logger.error(`err occurred when running search: ${err}`);
                    reject(false);
                }
                logger.debug(`search found ${data.length} results for query: '${query}'`);
                resolve(data);
            });
    });
};

exports.addApprovedActivity = (activityId, userId) => {

};

