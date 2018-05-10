/**
 * Created by Haimov on 15/03/2018.
 */
let USER = require('../models/User'),
    COMMUNITY = require('../models/Community'),
    Utils = require('../utils'),
    userService = require('./../services/userService'),
    communityService = require('./../services/communityService'),
    activityService = require('./../services/activityService'),
    Promise = require('promise'),
    logger = Utils.getLogger();


exports.create = (req, res) => {
    let newCommunity = new COMMUNITY({
        communityName: req.body.communityName,
        communityDescription: req.body.communityDescription,
        creationDate: Utils.now(),
        managerId: req.body.managerId,
        managerName: req.body.managerName,
        members: {
            memberId: req.body.managerId,
        },
        type: req.body.type
    });
    communityService.saveNewCommunity(newCommunity)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.search = (req, res) => {
    let query = req.params.query || '';
    communityService.searchCommunities(query)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.getByUserId = (req, res) => {
    let userId = req.params.key;
    communityService.getUserCommunities(userId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.leave = (req, res) => {
    let userId = req.body.uid;
    let communityId = req.body.communityId;

    communityService.leaveCommunity(userId, communityId)
        .then(response => {
            activityService.deleteUserActivities(userId, communityId, ['open'])
                .then(activity => {
                    res.json(response);
                }).catch(err => {
                res.json(err);
            });
        })
        .catch(err => {
            res.json(err);
        });
};

exports.delete = (req, res) => {
    let communityId = req.body.communityId;
    let userId = req.body.uid;
    let actions = [];

    logger.info(`delete community: ${communityId} was invoked by: ${userId}`);

    USER.find(
        {communities: {$elemMatch: {communityId: communityId}}},
        (err, data) => {
            if (err) {
                res.json(err);
            }
            data.forEach(function (user) {
                try {
                    if (user) {
                        actions.push(userService.removeCommunityFromUser(user.keyForFirebase, communityId));
                        actions.push(activityService.deleteUserActivities(user.keyForFirebase, communityId, ['open']));
                    }
                } catch (e) {
                    logger.error(`failed to remove community ${communityId} from user ${user.keyForFirebase} due to: ${e}`);
                    res.json(false);
                }
            });
            Promise.all(actions)
                .then(() => {
                    communityService.deleteCommunityById(communityId).then((response) => {
                        res.json(response);
                    });
                })
                .catch(err => {
                    res.json(err);
                });
        });
};

exports.join = (req, res) => {
    let {uid, isPrivileged, communityId} = req.body;
    let newCommunity = {
        communityId: communityId,
        role: 'Member'
    };

    //adding user to community members
    communityService.addUserToCommunityMembers(uid, communityId, isPrivileged)
        .then(response => {
            if (!response) {
                res.json(response);
            }
            //adding community to user
            userService.addCommunityToUser(uid, newCommunity)
                .then(user => {
                    communityService.removeFromWaitingList(uid, communityId)
                        .then(response => {
                            res.json(user);
                        })
                        .catch(err => {
                            res.json(err);
                        });
                })
                .catch(err => {
                    res.json(err);
                });
        })
        .catch(err => {
            res.json(err);
        });
};

exports.getMembers = (req, res) => {
    communityService.getCommunityMembers(req.body.communityId)
        .then((response) => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.updateUserRole = (req, res) => {
    let userId = req.body.uid;
    let communityId = req.body.communityId;
    let role = userService.getRole(req.body.role);
    let action;

    try {
        if (role == null) {
            logger.info(`${role} role is invalid`);
            res.json(false);
        }
        //update user
        userService.updateUserRole(userId, communityId, role)
            .then(response => {
                if (!response) {
                    res.json(false);
                }
                //update community
                action = (role === 'authorizedMember') ? communityService.setAsAuthorizedMember : communityService.setAsMember;
                action(communityId, userId)
                    .then(result => {
                        res.json(result);
                    })
                    .catch(err => {
                        res.json(err);
                    });
            })
            .catch(err => {
                res.json(err);
            });
    } catch (e) {
        logger.error(`failed to update user: ${userId} role to: ${role} in community ${communityId} due to: ${e}`);
        res.json(false);
    }
};

exports.addUserToWaitingList = (req, res) => {
    let {userId, communityId} = req.body;
    communityService.addToWaitingList(userId, communityId)
        .then(response => {
            res.json(response)
        })
        .catch(err => {
            res.json(false);
        });
};

exports.removeUserFromWaitingList = (req, res) => {
    let {userId, communityId} = req.body;
    communityService.removeFromWaitingList(userId, communityId)
        .then(response => {
            res.json(response)
        })
        .catch(err => {
            res.json(false);
        });
};
