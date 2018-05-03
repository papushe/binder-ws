let USER = require('../models/User'),
    Utils = require('../utils'),
    logger = Utils.getLogger(),
    userService = require('./../services/userService'),
    communityService = require('./../services/communityService'),
    Promise = require('promise');

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
        profilePic: req.body.profilePic,
        keyForFirebase: req.body.keyForFirebase
    });
  userService.saveNewUser(newUser)
      .then(response => {
        res.json(response);
    })
      .catch(err => {
          res.json(err);
      });
};

exports.getProfile = (req, res) => {
let userId = req.params.key;
    userService.getUserProfile(userId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.updateProfile = (req, res) => {
    let profileObj = {
        userId:req.body.keyForFirebase,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        location: req.body.location,
        phoneNumber: req.body.phoneNumber,
        dateOfBirth: req.body.dateOfBirth,
        type: req.body.type,
        skills: req.body.skills,
        description: req.body.description,
        profilePic: req.body.profilePic
    };
    userService.updateUserProfile(profileObj)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.deleteProfile = (req, res) => {
    let userId = req.params.key;
    let userCommunities;
    let actions = [];
    communityService.getUserCommunities(userId)
        .then(communities => {
            if (communities.length == 0) {
                userService.deleteUser(userId)
                    .then(response => {
                         res.json(response);
                    })
                    .catch(err => {
                        res.json(err);
                    });
            }
            else {
                userCommunities = communities;
                userCommunities.forEach(community => {
                    actions.push(communityService.leaveCommunity(userId, community._id));
                });
                //delete user from db
                actions.push(userService.deleteUser(userId));
                Promise.all(actions)
                    .then(response => {
                        res.json(response);
                    })
                    .catch(err => {
                        res.json(err);
                    });
            }
         })
        .catch(err => {
            res.json(err);
        });
};

exports.searchUsers = (req, res) => {
    let query = req.params.query || '';
    userService.searchUsers(query)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};


