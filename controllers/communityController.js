/**
 * Created by Haimov on 15/03/2018.
 */
let USER = require('../models/User'),
    COMMUNITY = require('../models/Community'),
    Utils = require('../utils'),
    userService = require('./../services/userService'),
    communityService = require('./../services/communityService');

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
    newCommunity.save(
        (err, data) => {
            if (err) {
                res.json(err);
            }
            // console.log(data)
            const newCommunity = {
                communityId: data._id,
                role: 'Manager'
            };
            USER.findOne({keyForFirebase: {$eq: data.managerId}},
                (err, data) => {
                    if (err || data == null) {
                        res.json(err);
                        return;
                    }
                    data.communities.push(newCommunity);
                    data.save(
                        (err, data) => {
                            if (err) {
                                res.json(err);
                            }
                            res.json(data);
                        }
                    );
                })
        }
    );
};

exports.searchCommunity = (req, res) => {
    let name = req.params.type;
    COMMUNITY.find(
        {communityName: {$regex: name, $options: "i"}, type: {$ne: 'Secured'}},
        (err, data) => {
            if (err) {
                console.log(`err occurred when running search: ${err}`);
                res.json(err);
            }
            res.json(data);
        });
};

exports.getCommunities = (req, res) => {
    COMMUNITY.find({members: {$elemMatch: {memberId: req.params.key}}},
        (err, data) => {
            if (err) {
                // console.log(err);
                res.json(err);
            }
            // console.log(data);
            res.json(data);
        });
};

exports.deleteCommunitiesByKey = (req, res) => {
    COMMUNITY.deleteMany({managerId: {$eq: req.params.key}},
        (err, data) => {
            if (err) {
                res.json(err);
            }
            res.json(data);
        });
};

exports.leaveCommunity = (req, res) => {
    let userId = req.body.uid;
    let communityId = req.body.communityId;
    let community;
    let newManagerId;

    //Step 1: removing user from community members
    COMMUNITY.findOneAndUpdate({_id: {$eq: communityId}},
        {$pull: {members: {memberId: userId}}},
        (err, data) => {
            if (err) {
                console.log(`error occurred while updating community: ${communityId}`);
            }
            //Step 2: remove community if no members left
            if (!data || !data._doc) {
                res.json(false);
            }
            if (data._doc.members.length == 1) {
                communityService.deleteCommunityById(communityId);
            }
            //Step 3: if the deleted user was the manager set a new one
            else {
                if (data._doc.managerId == userId) {
                    newManagerId = communityService.getNextNewManagerId(data.toObject());
                    data.set({
                        managerId: newManagerId
                    });
                    userService.updateUserRole(newManagerId, communityId, 'Manager');
                }
            }
            data.save((err, data) => {
                if (err) {
                    console.log(`error occurred while removing user: ${userId} from community: ${communityId}`);
                    res.json(false);
                }

                //Step 4: removing community from user
                userService.removeCommunityFromUser(userId, communityId);
                res.json(true);
            });
        }
    );
};

exports.joinCommunity = (req, res) => {
    let userId = req.body.uid;
    let communityId = req.body.communityId;

    let newCommunity = {
        communityId: communityId,
        role: 'Member'
    };

    //adding user from community members
    COMMUNITY.findOne({$and: [{_id: {$eq: communityId}}, {type: {$eq: 'Public'}}]},
        (err, data) => {
            if (err) {
                console.log(`error occurred while trying add user: ${userId} to community: ${communityId}: ${err}`);
                res.json(false);
            }
            if (data == null || data.members == null) {
                console.log(`error occurred while trying add user: ${userId} to community: ${communityId}: ${err}`);
                res.json(false);
                return;
            }
            data.members.push({memberId: userId});
            data.save((err, data) => {
                if (err) {
                    console.log(`error occurred while trying add user: ${userId} to community: ${communityId}: ${err}`);
                    res.json(false);
                    return;
                }
                //adding community to user
                userService.addCommunityToUser(userId, newCommunity);
                res.json(true);
            });
        });
};

exports.getCommunityMembers = (req, res) => {
    USER.find({communities: {$elemMatch: {communityId: req.body.communityId}}},
        (err, data) => {
            if (err) {
                console.log(`got community members successfully`);
                res.json(err);
            }
            res.json(data);
        });
};




