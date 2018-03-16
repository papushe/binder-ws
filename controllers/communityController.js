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