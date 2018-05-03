let ACTIVITY = require('../models/Activity'),
    Promise = require('promise'),
    Utils = require('../utils'),
    logger = Utils.getLogger();

exports.saveNewActivity = (newActivity) => {
    return new Promise((resolve, reject) => {
        newActivity.save(
            (err, data) => {
                if (err) {
                    logger.error(`failed to create activity: ${newActivity} due to: ${err}`);
                    reject(false);
                }
                else {
                    logger.info(`Activity: ${data._id} was created`);
                    resolve(data);
                }
            }
        );
    });
};

exports.getUserActivities = (userId) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.find({$or: [{"consumer.id": {$eq: userId}}, {"provider.id": {$eq: userId}}]},
            (err, data) => {
                if (err) {
                    logger.error(`failed to get user: ${userId} activities due to: ${err}`);
                    reject(false);
                }
                logger.info(`got user: ${userId} activities`);
                resolve(data);
            });
    });
};

exports.getCommunityActivities = (communityId) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.find({community_id: {$eq: communityId}},
            (err, data) => {
                if (err) {
                    logger.error(`failed to get community: ${communityId} activities due to: ${err}`);
                    reject(false);
                }
                logger.info(`got community: ${communityId} activities`);
                resolve(data);
            });
    });
};

exports.deleteActivityById = (activityId) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.deleteOne({_id: {$eq: activityId}},
            (err, data) => {
                if (err) {
                    logger.error(`failed to delete activity: ${activityId} due to: ${err}`);
                    reject(false);
                }
                logger.info(`activity: ${activityId} was deleted!`);
                resolve(true);
            });
    });
};


exports.saveExistingActivity = (newActivity, activityId) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.findOne({_id: activityId},
            (err, data) => {
                if (err) {
                    logger.error(`Failed to updated activity #${newActivity.activity_name} due to ${err}`);
                    reject(false);
                }
                data.set({
                    activity_name: newActivity.activity_name,
                    activity_description: newActivity.activity_description,
                    type: newActivity.type,
                    created_at: Utils.now(),
                    consumer: newActivity.consumer,
                    provider: newActivity.provider,
                    community_id: newActivity.community_id,
                    source: newActivity.source,
                    destination: newActivity.destination,
                    activity_date: Utils.normalizeDate(newActivity.activity_date),
                    notes: newActivity.notes
                });
                data.save(
                    (err, data) => {
                        if (err) {
                            logger.error(`failed to update activity #${newActivity.activity_name} profile due to: ${err}`);
                            reject(false);
                        }
                        logger.info(`user: #${newActivity.activity_name} profile was updated`);
                        resolve(data);
                    }
                );
            })
    })
};
