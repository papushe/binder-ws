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

exports.getCommunityActivities = (communityId, filters) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.find(
            {$and:[
                {community_id: {$eq: communityId}},
                {"status.value": {$in: filters}}
            ]},
            (err, data) => {
                if (err) {
                    logger.error(`failed to get community: ${communityId} activities due to: ${err}`);
                    reject(false);
                }
                logger.info(`got community: ${communityId} activities with statuses: ${filters}`);
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

exports.setClaimer = (userId,fullName, activityId) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.findOne({_id: {$eq: activityId}},
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to set user: ${userId} as claimer in activity: ${activityId} due to: ${err}`);
                    reject(false);
                }
                else {
                    data.status = {
                        value: 'claimed',
                        user_id: userId,
                        fullName: fullName
                    };
                    data.save((err, data) => {
                        if (err) {
                            logger.error(`failed to set user: ${userId} as claimer in activity: ${activityId} due to: ${err}`);
                            reject(false);
                        }
                        logger.info(`user: ${userId} was set as claimer in activity: ${activityId}`);
                        resolve(data);
                    });
                }
            });
    });
};

exports.setProvider = (activityId) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.findOne({_id: {$eq: activityId}},
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to set provider in activity: ${activityId} due to: ${err}`);
                    reject(false);
                }
                if (!data.status.user_id) {
                    logger.error(`failed to set provider in activity: ${activityId} due to: claimer is missing!`);
                    reject(false);
                }
                else {
                    data.status.value = 'approved';
                    data.provider = {
                        name: data.status.fullName,
                        id: data.status.user_id
                    };
                    data.save((err, data) => {
                        if (err) {
                            logger.error(`failed to set provider in activity: ${activityId} due to: ${err}`);
                            reject(false);
                        }
                        logger.info(`${data._doc.status.user_id} was set as provider in activity: ${activityId}`);
                        resolve(data);
                    });
                }
            });
    });
};

exports.deleteUserActivities = (userId, filters) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.remove(
            {$and:[
                    {"consumer.id": {$eq: userId}},
                    {"status.value": {$in: filters}}
                ]},
            (err, data) => {
                if (err) {
                    logger.error(`failed to delete user: ${userId} activities due to: ${err}`);
                    reject(false);
                }
                logger.info(`deleted user: ${userId} activities with statuses: ${filters}`);
                resolve(data);
            });
    });
};

