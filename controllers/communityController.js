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
    COMMUNITY.find({communityName: {$in: name}, type: {$ne: 'Secured'}},
        (err, data) => {
            if (err) {
                console.log(`err occurred when running search: ${err}`);
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
            console.log(data);
            if (data._doc.members.length == 1) {
                console.log(`removing community: ${communityId}`);
                COMMUNITY.findOneAndRemove({_id: {$eq: communityId}}, (err) => {
                    if (err) {
                        console.log(`error occurred while removing user: ${userId} from community: ${communityId}`);
                    }
                });
            }
            //Step 3: if the deleted user was the manager set a new one
            else {
                if (data._doc.managerId == userId) {
                    newManagerId = getNextNewManagerId(data.toObject());
                    data.set({
                        managerId: newManagerId
                    });
                }
            }
            data.save((err, data) => {
                if (err) {
                    console.log(`error occurred while removing user: ${userId} from community: ${communityId}`);
                }

                //Step 4: removing community from user
                USER.findOneAndUpdate({keyForFirebase: {$eq: userId}},
                    {$pull: {communities: {communityId: communityId}}},
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




    //Step 5: update new manager role
    // USER.update({keyForFirebase: {$eq: newManagerId}}, {communities: {communityId: communityId}},
    //     {$set: {'communities.$.role': 'Manager'}},
    //     (err, data) => {
    //         if (err) {
    //             console.log(`error occurred while updating user: ${newManagerId} as manager of ${communityId}: ${err}`);
    //         }
    //         res.json(true);
    //     });
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
                USER.findOne({keyForFirebase: {$eq: userId}},
                    (err, data) => {
                        if (err) {
                            console.log(`error occurred while trying add user community: ${communityId} to communities list: ${err}`);
                            res.json(false);
                            return;
                        }

                        if (data == null || data.communities == null) {
                            console.log(`error occurred while trying add user: ${userId} to community: ${communityId}: ${err}`);
                            res.json(false);
                            return;
                        }

                        data.communities.push(newCommunity);
                        console.log(data);
                        data.save((err, data) => {
                            if (err) {
                                console.log(`error occurred while trying add user community: ${communityId} to communities list: ${err}`);
                                res.json(false);
                            }
                            console.log(`community: ${communityId} was added to communities list for user: ${userId}`);
                            res.json(true);
                        });

                    });
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

function getNextNewManagerId(community) {
    let newManagerId = null;

    if (community.authorizedMembers.length > 0) {
         community.authorizedMembers.forEach( authMember => {
            if (authMember.memberId != community.managerId) {
                newManagerId =  authMember.memberId;
            }
        })
    }
    if (community.members.length > 0) {
         community.members.forEach( member => {
            if (member.memberId != community.managerId) {
                newManagerId =  member.memberId;
            }
        })
    }
    return newManagerId;
}



