/**
 * Created by Haimov on 15/03/2018.
 */
let USER = require('../models/User'),
    COMMUNITY = require('../models/Community'),
    manager = 'Manager';

exports.errorHandling = (req, res) => {
    res.json({"error": "404 - not found (Wrong input or Wrong url)"});
};

exports.createNewCommunity = (req, res) => {
    let newCommunity = new COMMUNITY({
        communityName: req.body.communityName,
        communityDescription: req.body.communityDescription,
        creationDate: createNewDate(),
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
                    if (err) {
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
    console.log(name);
    COMMUNITY.find({communityName: {$in: name}},
        (err, data) => {
            console.log("data " + data);
            console.log("err " + err);
            if (err) {
                res.json(err);
            }
            res.json(data);
        });
};

exports.getCommunities = function (req, res) {
    // console.log(req.params.key);

    // db.users.find({members: {$elemMatch: {memberId:req.params.key}}})

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