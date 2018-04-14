let COMMUNITY = require('../models/Community');
let USER = require('../models/User');
let userService = require('./userService');
let Promise = require('promise');

function getNextNewManagerId (community) {
    return new Promise((resolve, reject) => {
        if (community.authorizedMembers.length > 0) {
            console.log(`user: ${community.authorizedMembers[0].memberId} has been chosen as new manager of community: ${community._id}`);
            resolve(community.authorizedMembers[0].memberId);
        }
        else if (community.members.length > 0){
            console.log(`user: ${community.members[0].memberId} has been chosen as new manager of community: ${community._id}`);
            resolve(community.members[0].memberId);
        }
        else {
            this.deleteCommunityById(community._id).then(function () {
                console.log(`community: ${community._id} was empty so it was deleted!`);
                reject(null);
            });
        }
    });
}

exports.saveNewCommunity = (community) => {
    let communityObj = {
        communityId: community._id,
        role: 'Manager'
    };

    return new Promise((resolve, reject) => {
        community.save((err, data) => {
                if (err) {
                    console.log(`failed to create a new community: ${community} due to: ${err}`);
                    reject(false);
                }
                console.log(`user ${community.managerId} created a new community: ${community._id}`);
                userService.addCommunityToUser(community.managerId, communityObj).then(response => {
                    resolve(response);
                });
            }
        );
    });
};

exports.getUserCommunities = (userId) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.find({members: {$elemMatch: {memberId: userId}}},
            (err, data) => {
                if (err) {
                    console.log(`failed to get user: ${userId} communities due to: ${err}`);
                    reject(false);
                }
                resolve(data);
            });
    });
};

exports.searchCommunities = (query) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.find(
            {communityName: {$regex: query, $options: "i"}, type: {$ne: 'Secured'}},
            (err, data) => {
                if (err) {
                    console.log(`err occurred when running search: ${err}`);
                    reject(false);
                }
                resolve(data);
            });
    });
};

exports.deleteCommunityById = (communityId) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.findOneAndRemove({_id: {$eq: communityId}}, (err) => {
            if (err) {
                console.log(`error occurred when tried to delete community: ${communityId}`);
                reject(false);
            }
            else {
                console.log(`community: ${communityId} was deleted`);
                resolve(true);
            }
        });
    });
};

exports.setAsAuthorizedMember = (communityId, userId) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.findOne({_id: {$eq: communityId}},
            (err, data) => {
                if (err) {
                    throw(`error occurred while trying set user: ${userId} as authorized member in community: ${communityId}: ${err}`);
                }
                if (data) {
                    data.authorizedMembers.push({memberId: userId});
                    data.save((err) => {
                        if (err) {
                            throw(`error occurred while trying set user: ${userId} as authorized member in community: ${communityId}: ${err}`);
                        }
                        console.log(`user ${userId} is now an authorized member in community: ${communityId}`);
                        resolve(true);
                    });
                }
                else {
                    reject(`error occurred while trying set user: ${userId} as authorized member in community: ${communityId}: data is undefined!`);
                }
            });
    });
};

exports.setAsMember = (communityId, userId) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.findOneAndUpdate({_id: {$eq: communityId}},
            {$pull: {authorizedMembers: {memberId: userId}}},
            (err, data) => {
                if (err) {
                    throw(`error occurred while trying set user: ${userId} as a member in community: ${communityId}: ${err}`);
                }

                if (data && data._doc) {
                    console.log(`user ${userId} is now a member in ${communityId}`);
                    resolve(true);
                }
                else {
                    reject(`error occurred while trying set user: ${userId} as member in community: ${communityId}: data is undefined!`);
                }
            });
    });
};

exports.setNewManager = (communityId) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.findOne({_id: {$eq: communityId}},
            (err, data) => {
                if (err) {
                    console.log(`failed to set a new manager in community: ${communityId} due to: ${err}`);
                    reject(false);
                }
                if (data) {
                    getNextNewManagerId(data).then(newManager => {
                        if (newManager == null) {
                            reject(false);
                        }

                        //set the new managerId
                        data.managerId = newManager;

                        //delete the new manager from authorized members
                        let index = data.authorizedMembers.map(o => { return o.memberId; }).indexOf(newManager);
                        data.authorizedMembers.splice(index,1);

                        //save community after all updates
                        data.save((err) => {
                            if (err) {
                                console.log(`failed to set a new manager in community: ${communityId} due to: ${err}`);
                                reject(false);
                            }
                            console.log(`user: ${newManager} is now a manager in community: ${communityId}`);
                            resolve(true);
                        });
                    });
                }
                reject(false);
            });
    });
};

exports.getCommunityMembers = (communityId) => {
    return new Promise((resolve, reject) => {
        USER.find({communities: {$elemMatch: {communityId: communityId}}},
            (err, data) => {
                if (err) {
                    console.log(`failed to get community: ${communityId} members due to: ${err}`);
                    reject(false);
                }
                console.log(`got community members`);
                resolve(data);
            });
    });
};

exports.addUserToCommunityMembers = (userId, communityId) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.findOne({$and: [{_id: {$eq: communityId}}, {type: {$eq: 'Public'}}]},
            (err, data) => {
                if (err) {
                    console.log(`error occurred while trying add user: ${userId} to community: ${communityId}: ${err}`);
                    reject(false);
                }
                if (data == null || data.members == null) {
                    console.log(`error occurred while trying add user: ${userId} to community: ${communityId}: ${err}`);
                    reject(false);
                }
                data.members.push({memberId: userId});
                data.save((err, data) => {
                    if (err) {
                        console.log(`error occurred while trying add user: ${userId} to community: ${communityId}: ${err}`);
                        reject(false);
                    }
                    resolve(true);
                });
            });
    });
};

exports.removeUserFromCommunityMembers = (userId, communityId) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.findOneAndUpdate({_id: {$eq: communityId}},
            {$pull: {members: {memberId: userId}, authorizedMembers: {memberId: userId}}},
            (err, data) => {
                if (err) {
                    console.log(`failed to remove user ${userId} from community: ${communityId} due to: ${err}`);
                    reject(false);
                }
                console.log(`user: ${userId} was removed from community: ${communityId}`);
                resolve(data.toObject());
            });
    });
};

exports.leaveCommunity = (userId, communityId) => {
    return new Promise((resolve, reject) => {
        //removing user from community members
        this.removeUserFromCommunityMembers(userId, communityId).then(data => {
            if (!data) {
                reject(false);
            }
            //remove community if no members left but this user
            if (data.members.length == 1) {
                this.deleteCommunityById(communityId).then(response => {
                    if (!response) {
                        reject(false);
                    }
                })
            }
            //removing community from user
            userService.removeCommunityFromUser(userId, communityId).then(response => {
                if (!response) {
                    reject(false);
                }
                //if the deleted member was the manager set a new one
                if (data.managerId == userId) {
                    this.setNewManager(communityId).then(response => {
                        resolve(response);
                    });
                }
                else resolve(true);
            });
        });
    });
};
