let USER = require('../models/User'),
    Utils = require('../utils');

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

exports.getProfile = function (req, res) {
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