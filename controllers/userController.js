let USER = require('../models/User'),
    COMMUNITY = require('../models/Community'),
    Utils = require('../utils'),
    SHARED = require('./sharedController');

exports.createNewUser = (req, res) => {
    let newUser = new USER({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        location: req.body.location,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        dateOfBirth: req.body.dateOfBirth,
        creationDate: Utils.now(),
        type: req.body.type,
        skills: req.body.skills,
        description: req.body.description,
        keyForFirebase: req.body.keyForFirebase
    });
    newUser.save(
        (err, data) => {
            if (err) {
                res.json(err);
            }
            res.json(data);
        }
    );
};

exports.getProfile = (req, res) => {
    USER.findOne({keyForFirebase: {$eq: req.params.key}},
        (err, data) => {
            if (err) {
                res.json(err);
            }
            res.json(data);
        });
};

exports.updateProfile = (req, res) => {
    USER.findOne({keyForFirebase: {$eq: req.body.keyForFirebase}},
        (err, data) => {
            if (err) {
                res.json(err);
                return;
            }
            data.set({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                location: req.body.location,
                phoneNumber: req.body.phoneNumber,
                dateOfBirth: req.body.dateOfBirth,
                type: req.body.type,
                skills: req.body.skills,
                description: req.body.description,
            });
            data.save(
                (err, data) => {
                    if (err) {
                        res.json(err);
                    }
                    res.json(data);
                }
            );
        })
};

exports.deleteProfile = (req, res) => {

    let userId = req.params.key;

    COMMUNITY.find(
        {members: {$elemMatch: {memberId: userId}}},
        (err, data) => {
            if (err) {
                // console.log(err);
                res.json(err);
            }
            // console.log(data);
            data.forEach(community => {

                community = deleteFromCommunity(community, userId);

                if (community.newId) {
                    community.community.set({
                        managerId: community.newId
                    });
                    community.community.save(
                        (err, data) => {
                            if (err) {
                                console.log(err)
                            }
                            console.log(data);
                        }
                    );
                } else {
                    community.community.remove(
                        (err, data) => {
                            if (err) {
                                console.error(err)
                            }
                            console.log(data);
                        })
                }
            })
        });

    //delete the user
    USER.findOneAndRemove({keyForFirebase: {$eq: userId}},
        (err, data) => {
            if (err) {
                res.json(err);
            }
            console.log("delete user");
            res.json(data);
        });
};

function deleteFromCommunity(community, userId) {

    let newId = null;
    let members = community._doc.members;
    let authorizedMembers = community._doc.authorizedMembers;
    let communityId = community._doc._id;

    for (let i = 0; i < members.length; i++) {
        if (members[i]._doc.memberId == userId) {
            members.splice(i, 1)
        }
    }
    for (let i = 0; i < authorizedMembers.length; i++) {
        if (authorizedMembers[i]._doc.memberId == userId) {
            authorizedMembers.splice(i, 1)
        }
    }

    if (community._doc.managerId == userId) {
        if (authorizedMembers.length > 0) {
            newId = authorizedMembers[0].memberId;
            SHARED.updateUserRole(newId, communityId, 'Manager');
        } else if (members.length > 0) {
            newId = members[0].memberId;
            SHARED.updateUserRole(newId, communityId, 'Manager');
        } else {
            newId = null;
        }
    }
    return {
        community,
        newId: newId
    };
}

