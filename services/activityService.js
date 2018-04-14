let ACTIVITY = require('../models/Activity');
let Promise = require('promise');

exports.saveNewActivity = (newActivity) => {
    return new Promise((resolve, reject) => {
        newActivity.save(
            (err, data) => {
                if (err) {
                    console.log(`Failed to create activity: ${newActivity} due to: ${err}`);
                    reject(false);
                }
                else {
                    console.log(`Activity: ${data._id} was created`);
                    resolve(data);
                }
            }
        );
    });
};

exports.getUserActivities = (userId) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.find({$or: [{consumer_id: {$eq: userId}}, {provider_id: {$eq: userId}}]},
            (err, data) => {
                if (err) {
                    console.log(`failed to get user: ${userId} activities due to: ${err}`);
                    reject(false);
                }
                console.log(`got user: ${userId} activities`);
                resolve(data);
            });
    });
};

exports.getCommunityActivities = (communityId) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.find({community_id: {$eq: communityId}},
            (err, data) => {
                if (err) {
                    console.log(`failed to get community: ${communityId} activities due to: ${err}`);
                    reject(false);
                }
                console.log(`got community: ${communityId} activities`);
                resolve(data);
            });
    });
};

exports.deleteActivityById = (activityId) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.deleteOne({_id: {$eq: activityId}},
            (err, data) => {
                if (err) {
                    console.log(`failed to delete activity: ${activityId} due to: ${err}`);
                    reject(false);
                }
                console.log(`activity: ${activityId} was deleted!`);
                resolve(true);
            });
    });
};


