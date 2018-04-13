/**
 * Created by Haimov on 15/03/2018.
 */
let USER = require('../models/User'),
    COMMUNITY = require('../models/Community'),
    Utils = require('../utils'),
    userService = require('./../services/userService'),
    communityService = require('./../services/communityService'),
    Promise = require('promise');


exports.createNewCommunity = (req, res) => {
    let newCommunity = new COMMUNITY({
        communityName: req.body.communityName,
        communityDescription: req.body.communityDescription,
        creationDate: Utils.now(),
        managerId: req.body.managerId,
        members: {
            memberId: req.body.managerId,
        },
        type: req.body.type
    });
communityService.saveNewCommunity(newCommunity).then(response => {
    res.json(response);
    })
};

exports.searchCommunity = (req, res) => {
    let query = req.params.type;
    communityService.searchCommunities(query).then(response => {
        res.json(response);
    })
};

exports.getCommunities = (req, res) => {
    let userId = req.params.key;
    communityService.getUserCommunities(userId).then(response => {
        res.json(response);
    })
};

exports.leaveCommunity = (req, res) => {
    let userId = req.body.uid;
    let communityId = req.body.communityId;

    communityService.leaveCommunity(userId, communityId).then(response => {
        res.json(response);
    });
};

exports.deleteCommunity = (req, res) => {
    let communityId = req.body.communityId;
    let userId = req.body.uid;
    let actions = [];

    console.log(`delete community: ${communityId} was invoked by: ${userId}`);

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
                    }
                } catch (e) {
                    console.error(`failed to remove community ${communityId} from user ${user.keyForFirebase} due to: ${e}`);
                    res.json(false);
                }
            });
            Promise.all(actions).then(() => {
                communityService.deleteCommunityById(communityId).then((response) =>{
                    res.json(response);
                });
            });
        });
};

exports.joinCommunity = (req, res) => {
    let userId = req.body.uid;
    let communityId = req.body.communityId;
    let newCommunity = {
        communityId: communityId,
        role: 'Member'
    };

    //adding user to community members
    communityService.addUserToCommunityMembers(userId, communityId).then(response => {
        if (!response) {
            res.json(response);
        }
        //adding community to user
        userService.addCommunityToUser(userId, newCommunity).then(response => {
            res.json(response);
        });
    });
};

exports.getCommunityMembers = (req, res) => {
    communityService.getCommunityMembers(req.body.communityId).then((response) => {
        res.json(response);
    });
};

exports.updateCommunityUserRole = (req, res) => {
    let userId = req.body.uid;
    let communityId = req.body.communityId;
    let role = userService.getRole(req.body.role);
    let action;

    try {
        console.log(`starting with updating user role...`);
        if (role == null) {
            console.log(`${role} role is invalid`);
            res.json(false);
        }
        //update user
        userService.updateUserRole(userId, communityId, role).then((response => {
            if(!response) {
                res.json(false);
            }
            //update community
            action = (role == 'authorizedMember') ? communityService.setAsAuthorizedMember : communityService.setAsMember;
            action(communityId, userId).then(result => {
                res.json(result);
            });
        }));
    } catch (e) {
        console.error(`failed to update user: ${userId} role to: ${role} in community ${communityId} due to: ${e}`);
        res.json(false);
    }
};


//temporally function to tests - DON'T USE IT
exports.deleteCommunitiesByKey = (req, res) => {
    COMMUNITY.deleteMany({managerId: {$eq: req.params.key}},
        (err, data) => {
            if (err) {
                res.json(err);
            }
            res.json(data);
        });
};




