let COMMUNITY = require('../models/Community'),
    USER = require('../models/User'),
    userService = require('./userService'),
    Promise = require('promise'),
    logger = require('../utils').getLogger();


function getNextNewManagerId (community) {
    return new Promise((resolve, reject) => {
        if (community.authorizedMembers.length > 0) {
            logger.info(`user: ${community.authorizedMembers[0].memberId} has been chosen as new manager of community: ${community._id}`);
            resolve(community.authorizedMembers[0].memberId);
        }
        else if (community.members.length > 0){
            logger.info(`user: ${community.members[0].memberId} has been chosen as new manager of community: ${community._id}`);
            resolve(community.members[0].memberId);
        }
        else {
            this.deleteCommunityById(community._id)
                .then(function () {
                    logger.info(`community: ${community._id} was empty so it was deleted!`);
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
                logger.error(`failed to create a new community: ${community} due to: ${err}`);
                reject(false);
            }
            logger.info(`user ${community.managerId} created a new community: ${community._id}`);
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
                    logger.error(`failed to get user: ${userId} communities due to: ${err}`);
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
                    logger.error(`err occurred when running search: ${err}`);
                    reject(false);
                }
                logger.info(`search found ${data.length} results for query: '${query}'`);
                resolve(data);
            });
    });
};

exports.deleteCommunityById = (communityId) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.findOneAndRemove({_id: {$eq: communityId}}, (err) => {
            if (err) {
                logger.error(`failed to delete community: ${communityId} due to: ${err}`);
                reject(false);
            }
            else {
                logger.info(`community: ${communityId} was deleted`);
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
                    logger.error(`failed to set user: ${userId} as authorized member in community: ${communityId} due to: ${err}`);
                    reject(false);
                }
                    data.authorizedMembers.push({memberId: userId});
                    data.save((err) => {
                        if (err) {
                            logger.error(`failed to set user: ${userId} as authorized member in community: ${communityId} due to: ${err}`);
                            reject(false);
                        }
                        logger.info(`user ${userId} is now an authorized member in community: ${communityId}`);
                        resolve(true);
                    });
            });
    });
};

exports.setAsMember = (communityId, userId) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.findOneAndUpdate({_id: {$eq: communityId}},
            {$pull: {authorizedMembers: {memberId: userId}}},
            {new: true},
            (err, data) => {
                if (err || !data || !data._doc) {
                    logger.error(`failed to set user: ${userId} as a member in community: ${communityId} due to: ${err}`);
                    reject(false);
                }
                else {
                    logger.info(`user ${userId} is now a member in ${communityId}`);
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
                    logger.error(`failed to set a new manager in community: ${communityId} due to: ${err}`);
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
                                    logger.error(`failed to set a new manager in community: ${communityId} due to: ${err}`);
                                    reject(false);
                                }
                                logger.info(`user: ${newManager} is now a manager in community: ${communityId}`);
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
                    logger.error(`failed to get community: ${communityId} members due to: ${err}`);
                    reject(false);
                }
                logger.info(`got community ${communityId} members`);
                resolve(data);
            });
    });
};

exports.addUserToCommunityMembers = (userId, communityId, isPrivileged) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.findOne({_id: {$eq: communityId}},
            (err, data) => {
                if (err || !data || !data.members) {
                    logger.error(`failed to add user: ${userId} to community: ${communityId} due to: ${err}`);
                    reject(false);
                }
                if (data.type === 'Private' && !isPrivileged) {
                    logger.error(`failed to add user: ${userId} to community: ${communityId} due to: user not allowed`);
                    reject(false);
                }
                else {
                    data.members.push({memberId: userId});
                    data.save((err, data) => {
                        if (err) {
                            logger.error(`failed to add user: ${userId} to community: ${communityId} due to: ${err}`);
                            reject(false);
                        }
                        logger.info(`user: ${userId} was added as member to community: ${communityId}`);
                        resolve(true);
                    });
                }
            });
    });
};

exports.removeUserFromCommunityMembers = (userId, communityId) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.findOneAndUpdate({_id: {$eq: communityId}},
            {$pull: {members: {memberId: userId}, authorizedMembers: {memberId: userId}}},
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to remove user ${userId} from community: ${communityId} due to: ${err}`);
                    reject(false);
                }
                logger.info(`user: ${userId} was removed from community: ${communityId}`);
                resolve(data);
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
                if (data.members && data.members.length === 0) {
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
                    .then(updatedUser => {
                        if (!updatedUser) {
                            reject(false);
                        }
                        //if the deleted member was the manager set a new one
                        if (data.managerId == userId && !shouldBeDeleted) {
                            this.setNewManager(communityId)
                                .then(response => {
                                    resolve(updatedUser);
                                })
                        .       catch(err => {
                                    reject(err);
                                 });
                        }
                        else  {
                            resolve(updatedUser);
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

exports.getCommunityById = (communityId) => {
        return new Promise((resolve, reject) => {
            COMMUNITY.findOne({_id: {$eq: communityId}},
                (err, data) => {
                if (err || !data) {
                    reject(false);
                }
                else {
                    resolve(data);
                }
        });
    });
};

exports.addToWaitingList = (userId, communityId) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.findOne({_id: {$eq: communityId}},
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to add user: ${userId} to community waiting list: ${communityId} due to: ${err}`);
                    reject(false);
                }
                else {
                    data.waiting_list.push(userId);
                    data.save((err, data) => {
                        if (err) {
                            logger.error(`failed to add user: ${userId} to community waiting list: ${communityId} due to: ${err}`);
                            reject(false);
                        }
                        logger.info(`user: ${userId} was added to community waiting list: ${communityId}`);
                        resolve(data);
                    });
                }
            });
    });
};

exports.removeFromWaitingList = (userId, communityId) => {
    return new Promise((resolve, reject) => {
        COMMUNITY.findOneAndUpdate({_id: {$eq: communityId}},
            {$pullAll: {waiting_list: [userId]}},
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to remove user ${userId} from community waiting list: ${communityId} due to: ${err}`);
                    reject(false);
                }
                logger.info(`user: ${userId} was removed from community waiting list: ${communityId}`);
                resolve(data);
            });
    });
};



