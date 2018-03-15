let USER = require('../models/User'),
    COMMUNITY = require('../models/Community'),
    manager = 'Manager';

exports.errorHandling = (req, res) => {
    res.json({"error": "404 - not found (Wrong input or Wrong url)"});
};

exports.createNewUser = (req, res) => {
    let newUser = new USER({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        location: req.body.location,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        dateOfBirth: req.body.dateOfBirth,
        creationDate: createNewDate(),
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









getRandomString = (length) => {
    length = 10;
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
fixTime = (minutes, second) => {
    if (second < 10 && second >= 0) {
        second = '0' + second;
    }
    if (minutes < 10 && minutes >= 0) {
        minutes = '0' + minutes;
    }
    return minutes + ':' + second;
};
fixDate = (date) => {

    if (date < 10 && date >= 0) {
        date = '0' + date;
    }
    return date;
};

createNewDate = () => {
    let date = new Date(),
        dateTime = fixDate(date.getDate()),
        monthIndex = fixDate(date.getMonth()),
        year = date.getFullYear(),
        fullDate = year + '-' + monthIndex + '-' + dateTime,
        hour = date.getHours(),
        minutes = date.getMinutes(),
        second = date.getSeconds();
    return fullDate + ', ' + hour + ':' + fixTime(minutes, second);
};