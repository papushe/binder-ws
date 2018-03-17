/**
 * Created by Haimov on 15/03/2018.
 */
let USER = require('../models/User'),
    COMMUNITY = require('../models/Community'),
    Utils = require('../utils'),
    manager = 'Manager';

exports.errorHandling = (req, res) => {
    res.json({"error": "404 - not found (Wrong input or Wrong url)"});
};

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
                role: manager
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

exports.searchCommunity = function (req, res) {
    let name = req.params.type;
    name = name.split(", ");
    name = name.map(v => v.toLowerCase());
    COMMUNITY.find({communityName: {$in: name}, type: {$ne: 'Secured'}},
        (err, data) => {
            if (err) {
                console.log("err occurred when running search");
                res.json(err);
            }
            res.json(data);
        });
};

exports.getCommunities = function (req, res) {
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

exports.deleteCommunitiesByKey = function (req, res) {
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

    //Step 1: removing user from community members
    COMMUNITY.findOneAndUpdate({_id: {$eq: communityId}},
        {$pull: {members: {$elemMatch: {memberId: userId}}}},
        {'new': true},
        (err, data) => {
            if (err) {
                console.log(`error occurred while removing user: ${userId} from community: ${communityId}`);
            }
            //Step 2: remove community if no members left
            console.log(data);
            if (data.members.length == 0) {
                console.log(`removing community: ${communityId}`);
                COMMUNITY.findOneAndRemove({_id: {$eq: communityId}}, (err) => {
                    if (err) {
                        console.log(`error occurred while removing user: ${userId} from community: ${communityId}`);
                    }
                });
            }
            //Step 3: if the deleted user was the manager set a new one
            else {
                if (data.managerId == userId) {
                    data = updateCommunityManager(data);
                }
            }
            data.save((err, data) => {
                if (err) {
                    console.log(`error occurred while removing user: ${userId} from community: ${communityId}`);
                }

                //Step 4: removing community from user
                USER.findOneAndUpdate({keyForFirebase: {$eq: userId}},
                    {$pull: {communities: {$elemMatch: {communityId: communityId}}}},
                    {'new': true},
                    (err, data) => {
                        if (err) {
                            console.log(`error occurred while removing user community: ${communityId} from communities list: ${err}`);
                        }
                        console.log(`community: ${communityId} was removed from communities list for user: ${userId}`);
                        res.json(true);
                    });
            });
        }
    );
};

function updateCommunityManager(community) {
    let updatedCommunity = community;
    if (community.authorizedMembers && community.authorizedMembers.length == 0) {
        community.managerId = community.members[0];
    }
    else {
        community.managerId = community.authorizedMembers[0];
    }

    USER.findOneAndUpdate({keyForFirebase: {$eq: community.managerId}},
        {communities: {$elemMatch: {communityId: community.communityId}}},
        {$set: {$elemMatch: {role: 'Manager'}}},
        {'new': true},
        (err, data) => {
            if (err) {
                console.log(`failed to update a new manager: ${community.managerId} for community: ${community.communityId}`)
            }
            return updatedCommunity;
        });
}

