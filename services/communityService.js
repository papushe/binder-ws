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
            this.deleteCommunityById(community._id)
                .then(function () {
                    console.log(`community: ${community._id} was empty so it was deleted!`);
                    resolve(null);
                })
                .catch(err => {
                    reject(err);
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
                    console.error(`failed to create a new community: ${community} due to: ${err}`);
                    reject(false);
                }
                console.log(`user ${community.managerId} created a new community: ${community._id}`);
                userService.addCommunityToUser(community.managerId, communityObj)
                    .then(response => {
                        resolve(response);
                    })
                    .catch(err => {
                        reject(err);
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
                    console.error(`failed to get user: ${userId} communities due to: ${err}`);
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
                    console.error(`err occurred when running search: ${err}`);
                    reject(false);
                }
                console.log(`search found ${data.length} results for query: '${query}'`);
                resolve(data);
            });
    });
};

exports.deleteCommunityById = (communityId) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.findOneAndRemove({_id: {$eq: communityId}}, (err) => {
            if (err) {
                console.error(`failed to delete community: ${communityId} due to: ${err}`);
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
                if (err || !data) {
                    console.error(`failed to set user: ${userId} as authorized member in community: ${communityId} due to: ${err}`);
                    reject(false);
                }
                    data.authorizedMembers.push({memberId: userId});
                    data.save((err) => {
                        if (err) {
                            console.error(`failed to set user: ${userId} as authorized member in community: ${communityId} due to: ${err}`);
                            reject(false);
                        }
                        console.log(`user ${userId} is now an authorized member in community: ${communityId}`);
                        resolve(true);
                    });
            });
    });
};

exports.setAsMember = (communityId, userId) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.findOneAndUpdate({_id: {$eq: communityId}},
            {$pull: {authorizedMembers: {memberId: userId}}},
            (err, data) => {
                if (err || !data || !data._doc) {
                    console.error(`failed to set user: ${userId} as a member in community: ${communityId} due to: ${err}`);
                    reject(false);
                }
                else {
                    console.log(`user ${userId} is now a member in ${communityId}`);
                    resolve(true);
                }
            });
    });
};

exports.setNewManager = (communityId) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.findOne({_id: {$eq: communityId}},
            (err, data) => {
                if (err) {
                    console.error(`failed to set a new manager in community: ${communityId} due to: ${err}`);
                    reject(false);
                }
                if (data) {
                    getNextNewManagerId(data)
                        .then(newManager => {
                            if (newManager == null) {
                                resolve(true);
                            }

                            //set the new managerId
                            data.managerId = newManager;

                            //delete the new manager from authorized members
                            let index = data.authorizedMembers.map(o => { return o.memberId; }).indexOf(newManager);
                            data.authorizedMembers.splice(index,1);

                            //save community after all updates
                            data.save((err) => {
                                if (err) {
                                    console.error(`failed to set a new manager in community: ${communityId} due to: ${err}`);
                                    reject(false);
                                }
                                console.log(`user: ${newManager} is now a manager in community: ${communityId}`);
                                resolve(true);
                            })

                    })
                        .catch(err => {
                            reject(err);
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
                    console.error(`failed to get community: ${communityId} members due to: ${err}`);
                    reject(false);
                }
                console.log(`got community ${communityId} members`);
                resolve(data);
            });
    });
};

exports.addUserToCommunityMembers = (userId, communityId, isPrivileged) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.findOne({_id: {$eq: communityId}},
            (err, data) => {
                if (err || !data || !data.members) {
                    console.error(`failed to add user: ${userId} to community: ${communityId} due to: ${err}`);
                    reject(false);
                }
                if (data.type === 'Private' && !isPrivileged) {
                    console.error(`failed to add user: ${userId} to community: ${communityId} due to: user not allowed`);
                    reject(false);
                }

                data.members.push({memberId: userId});
                data.save((err, data) => {
                    if (err) {
                        console.error(`failed to add user: ${userId} to community: ${communityId} due to: ${err}`);
                        reject(false);
                    }
                    console.log(`user: ${userId} was added as member to community: ${communityId}`);
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
                if (err || !data) {
                    console.error(`failed to remove user ${userId} from community: ${communityId} due to: ${err}`);
                    reject(false);
                }
                console.log(`user: ${userId} was removed from community: ${communityId}`);
                resolve(data.toObject());
            });
    });
};

exports.leaveCommunity = (userId, communityId) => {
    let shouldBeDeleted;
    return new Promise((resolve, reject) => {
        //removing user from community members
        this.removeUserFromCommunityMembers(userId, communityId)
            .then(data => {
                if (!data) {
                    reject(false);
                }
                //remove community if no members left but this user
                if (data.members && data.members.length == 1) {
                    shouldBeDeleted = true;
                    this.deleteCommunityById(communityId)
                        .then(response => {
                            if (!response) {
                                reject(false);
                            }
                        })
                        .catch(err => {
                            reject(err);
                        });
                }
                //removing community from user
                userService.removeCommunityFromUser(userId, communityId)
                    .then(response => {
                        if (!response) {
                            reject(false);
                        }
                        //if the deleted member was the manager set a new one
                        if (data.managerId == userId && !shouldBeDeleted) {
                            this.setNewManager(communityId)
                                .then(response => {
                                    resolve(response);
                                })
                        .       catch(err => {
                                    reject(err);
                                 });
                        }
                        else  {
                            resolve(true);
                        }
                    })
                    .catch(err => {
                        reject(err);
                    });
             })
            .catch(err => {
                reject(err);
            });
    });
};
