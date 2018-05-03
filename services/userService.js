let USER = require('../models/User'),
    Promise = require('promise'),
    logger = require('../utils').getLogger();


const ROLE_MANAGER = 'Manager',
      ROLE_AUTHORIZED = 'authorizedMember',
      ROLE_MEMBER = 'Member';

exports.getRole = (role) => {
    return (role.match(new RegExp('authorized', "ig"))) ? ROLE_AUTHORIZED : ROLE_MEMBER;
};

exports.saveNewUser = (newUser) => {
    return new Promise((resolve, reject) => {
        newUser.save((err, data) => {
                if (err) {
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
                resolve(data);
            });
    });
};

exports.updateUserProfile = (profileObj) => {
    return new Promise((resolve, reject) => {
        USER.findOne({keyForFirebase: {$eq: profileObj.userId}},
            (err, data) => {
                if (err) {
                    logger.error(`failed to save user: ${profileObj.userId} profile due to: ${err}`);
                    reject(false);
                }
                data.set({
                    firstName: profileObj.firstName || '',
                    lastName: profileObj.lastName || '',
                    location: profileObj.location || '',
                    phoneNumber: profileObj.phoneNumber || '',
                    dateOfBirth: profileObj.dateOfBirth || '',
                    type: profileObj.type || '',
                    skills: profileObj.skills || '',
                    description: profileObj.description || '',
                    profilePic: profileObj.profilePic || ''
                });
                data.save(
                    (err, data) => {
                        if (err) {
                            logger.error(`failed to save user: ${profileObj.userId} profile due to: ${err}`);
                            reject(false);
                        }
                        logger.info(`user: ${profileObj.userId} profile was updated`);
                        resolve(data);
                    }
                );
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
                if (err) {
                    logger.info(err);
                    reject(err);
                }
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
                if (err) {
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
                if (err || data == null || data.communities == null) {
                    logger.error(`failed to add user community: ${newCommunity.communityId} to communities list due to: ${err}`);
                    reject(false);
                }
                data.communities.push(newCommunity);
                data.save((err, data) => {
                    if (err) {
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
                if (err) {
                    logger.error(`err occurred when running search: ${err}`);
                    reject(false);
                }
                logger.info(`search found ${data.length} results for query: '${query}'`);
                resolve(data);
            });
    });
};


