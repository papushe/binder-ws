let ACTIVITY = require('../models/Activity'),
    schedulerService = require('../services/schedulerService'),
    Promise = require('promise'),
    Utils = require('../utils'),
    logger = Utils.getLogger();

exports.saveNewActivity = (newActivity) => {
    return new Promise((resolve, reject) => {
        newActivity.save(
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to create activity: ${newActivity} due to: ${err}`);
                    reject(false);
                }
                else {
                    logger.info(`activity: ${data._id} was created`);
                    resolve(data);
                }
            }
        );
    });
};

exports.getActivityById = (activityId) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.find({id: {$eq: activityId}},
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to get activity: ${activityId} due to: ${err}`);
                    reject(false);
                }
                logger.debug(`got activity ${activityId}`);
                resolve(data);
            });
    });
};

exports.getUserActivities = (userId) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.find({$or: [{"consumer.id": {$eq: userId}}, {"provider.id": {$eq: userId}}]},
            (err, data) => {
                if (err || !data) {
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
            {
                $and: [
                    {community_id: {$eq: communityId}},
                    {"status.value": {$in: filters}}
                ]
            },
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to get community: ${communityId} activities due to: ${err}`);
                    reject(false);
                }
                logger.debug(`got community: ${communityId} activities with statuses: ${filters}`);
                resolve(data);
            });
    });
};

exports.deleteActivityById = (activityId) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.deleteOne({_id: {$eq: activityId}},
            (err, data) => {
                if (err || !data) {
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
                if (err || !data) {
                    logger.error(`Failed to updated activity #${newActivity.activity_name} due to ${err}`);
                    reject(false);
                }
                data.set({
                    activity_name: newActivity.activity_name,
                    activity_description: newActivity.activity_description,
                    type: newActivity.type,
                    consumer: newActivity.consumer,
                    provider: newActivity.provider,
                    community_id: newActivity.community_id,
                    activity_date: newActivity.activity_date,
                    source: newActivity.source,
                    destination: newActivity.destination,
                    notes: newActivity.notes
                });
                data.save(
                    (err, data) => {
                        if (err || !data) {
                            logger.error(`failed to update activity #${newActivity.activity_name} profile due to: ${err}`);
                            reject(false);
                        }
                        logger.debug(`activity: ${newActivity.activity_name} was updated`);
                        resolve(data);
                    }
                );
            })
    })
};

exports.setClaimer = (userId, fullName, activityId) => {
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
                        if (err || !data) {
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
    let newStatus = 'approved';
    return new Promise((resolve, reject) => {
        ACTIVITY.findOne({_id: {$eq: activityId}},
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to set provider in activity: ${activityId} due to: ${err}`);
                    reject(false);
                }
                else {
                    if (!data.status.user_id) {
                        newStatus = 'open';
                        logger.warn(`cant set provider in activity: ${activityId} due to: claimer is missing!`);
                        logger.info(`changed activity: ${activityId} to status: ${newStatus}`);
                    }
                    data.status.value = newStatus;
                    data.provider = {
                        name: data.status.fullName || '',
                        id: data.status.user_id || ''
                    };
                    data.save((err, data) => {
                        if (err || !data) {
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

exports.declineClaimer = (activityId) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.findOne({_id: {$eq: activityId}},
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to decline claimer in activity: ${activityId} due to: ${err}`);
                    reject(false);
                }
                if (!data.status.user_id) {
                    logger.error(`failed to decline claimer in activity: ${activityId} due to: claimer is missing!`);
                    reject(false);
                }
                else {
                    let claimer = data.status.user_id;
                    data.status.value = 'open';
                    data.provider = {
                        name: '',
                        id: ''
                    };
                    data.save((err, data) => {
                        if (err || !data) {
                            logger.error(`failed to decline claimer in activity: ${activityId} due to: ${err}`);
                            reject(false);
                        }
                        logger.info(`claimer: ${claimer} was declined in activity: ${activityId}`);
                        resolve(data);
                    });
                }
            });
    });
};

exports.deleteUserActivities = (userId, communityId, filters) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.remove(
            {
                $and: [
                    {"consumer.id": {$eq: userId}},
                    {community_id: {$eq: communityId}},
                    {"status.value": {$in: filters}}
                ]
            },
            (err, data) => {
                if (err || !data) {
                    logger.error(`failed to delete user: ${userId} activities due to: ${err}`);
                    reject(false);
                }
                logger.info(`deleted user: ${userId} activities with statuses: ${filters}`);
                resolve(data);
            });
    });
};

exports.execute = () => {
    let promises = [];
    schedulerService.getJobsToExecute()
        .then(data => {
            if (!data && data.length === 0) {
                resolve([]);
            }
            else {
                data.forEach(activityId => {
                    promises.push(this.getActivityById(activityId));
                });

                Promise.all(promises)
                    .then(activitiesObjList => {
                        activitiesObjList.forEach(activity => {
                            //TODO add socket emit and save notification
                        });
                        resolve(activitiesObjList);
                    })
                    .catch(err => {
                        logger.error(`failed to get all activities which associated to upcoming jobs due to: ${err}`);
                        reject(err);
                    });
            }
        })
        .catch(err => {
            logger.error(`failed to get jobs since 5 min ago till the next 5 min due to: ${err}`);
            reject(err);
        });

};