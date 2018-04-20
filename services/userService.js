let USER = require('../models/User');
let Promise = require('promise');

const ROLE_MANAGER = 'Manager';
const ROLE_AUTHORIZED = 'authorizedMember';
const ROLE_MEMBER = 'Member';

exports.getRole = (role) => {
    return (role.match(new RegExp('authorized', "ig"))) ? ROLE_AUTHORIZED : ROLE_MEMBER;
};

exports.saveNewUser = (newUser) => {
    return new Promise((resolve, reject) => {
        newUser.save((err, data) => {
                if (err) {
                    console.error(`failed to create user: ${newUser} due to: ${err}`);
                    reject(false);
                }
                console.log(`new user: ${newUser._id} was created`);
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
                    console.error(`failed to get user: ${userId} profile due to: ${err}`);
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
                    console.error(`failed to save user: ${profileObj.userId} profile due to: ${err}`);
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
                            console.error(`failed to save user: ${profileObj.userId} profile due to: ${err}`);
                            reject(false);
                        }
                        console.log(`user: ${profileObj.userId} profile was updated`);
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
                    console.log(err);
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
            (err, data) => {
                if (err) {
                    console.error(`failed to remove user community: ${communityId} from user: ${userId} communities list due to: ${err}`);
                    reject(false);
                }
                console.log(`community: ${communityId} was removed from communities list for user: ${userId}`);
                resolve(true);
            });
    });
};

exports.addCommunityToUser = (userId, newCommunity) => {
    return new Promise((resolve, reject) => {
        USER.findOne({keyForFirebase: {$eq: userId}},
            (err, data) => {
                if (err || data == null || data.communities == null) {
                    console.error(`failed to add user community: ${newCommunity.communityId} to communities list due to: ${err}`);
                    reject(false);
                }
                data.communities.push(newCommunity);
                data.save((err, data) => {
                    if (err) {
                        console.log(`error occurred while trying add user community: ${newCommunity.communityId} to communities list: ${err}`);
                        reject(false);
                    }
                    console.log(`community: ${newCommunity.communityId} was added to communities list for user: ${userId}`);
                    resolve(true);
                });
            });
    });
};

exports.deleteUser = (userId) => {
    return new Promise((resolve, reject) => {
        USER.findOneAndRemove({keyForFirebase: {$eq: userId}},
            (err, data) => {
                if (err) {
                    console.error(`failed to delete user: ${userId} due to: ${err}`);
                    reject(false);
                }
                console.log(`user: ${userId} was deleted!`);
                resolve(true);
            });
    });
};

exports.searchUsers = (query) => {
    return new Promise((resolve, reject) => {
        USER.find(
            {$or:
                [
                {firstName: {$regex: query, $options: "i"}},
                {lastName: {$regex: query, $options: "i"}}
                ]
            },
            (err, data) => {
                if (err) {
                    console.error(`err occurred when running search: ${err}`);
                    reject(false);
                }
                console.log(`search found ${data.length} results for query: '${query}'`);
                resolve(data);
            });
    });
};


