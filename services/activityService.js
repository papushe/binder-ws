let ACTIVITY = require('../models/Activity'),
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
        ACTIVITY.findOne({_id: {$eq: activityId}},
            (err, data) => {
                if (err) {
                    logger.error(`failed to get activity: ${activityId} due to: ${err}`);
                    reject(false);
                }
                if (!data) {
                    logger.warn(`cant get non-existed activity: ${activityId}`);
                    resolve([]);
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
                logger.debug(`got user: ${userId} activities`);
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
        ACTIVITY.findOne({_id: {$eq: activityId}},
            (err, data) => {
                if (err) {
                    logger.error(`Failed to updated activity: ${activityId} due to ${err}`);
                    reject(false);
                }

                if (!data) {
                    logger.warn(`Cant update non-existed activity: ${activityId} - creating new one...`);
                    this.saveNewActivity(newActivity)
                        .then(activity => {
                            resolve(activity);
                        })
                        .catch(err => {
                            reject(false);
                        });
                }
                else {
                    data.set({
                        activity_name: newActivity.activity_name,
                        activity_description: newActivity.activity_description,
                        type: newActivity.type,
                        consumer: newActivity.consumer,
                        provider: newActivity.provider,
                        recurring: newActivity.recurring,
                        community_id: newActivity.community_id,
                        activity_date: newActivity.activity_date,
                        source: newActivity.source,
                        destination: newActivity.destination,
                        notes: newActivity.notes
                    });
                    data.save(
                        (err, data) => {
                            if (err || !data) {
                                logger.error(`failed to update activity ${newActivity.activity_name} due to: ${err}`);
                                reject(false);
                            }
                            logger.debug(`activity: ${newActivity.activity_name} was updated`);
                            resolve(data);
                        }
                    );
                }
            })
    })
};

exports.updateActivityStatus = (activityId, status) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.findOne({_id: activityId},
            (err, data) => {
                if (err || !data) {
                    logger.error(`Failed to updated activity: ${activityId} status to: ${status} due to ${err}`);
                    reject(false);
                }
                data.status.value = status;
                data.save(
                    (err, data) => {
                        if (err || !data) {
                            logger.error(`failed to update activity: ${activityId} status to: ${status} due to: ${err}`);
                            reject(false);
                        }
                        logger.debug(`activity: ${activityId} status was updated to: ${status}`);
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
    let success = false;
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
                    data.provider = {
                        name: newStatus === 'open' ? '' : data.status.fullName,
                        id: newStatus === 'open' ? '' : data.status.user_id
                    };
                    data.status = {
                        value: newStatus,
                        user_id: '',
                        fullName: ''
                    };
                    data.save((err, data) => {
                        if (err || !data) {
                            logger.error(`failed to set provider in activity: ${activityId} due to: ${err}`);
                            reject(false);
                        }
                        else {
                            logger.info(`${data.provider.id} was set as provider in activity: ${activityId}`);
                            success = newStatus === 'approved';
                            resolve({activity: data, success: success});
                        }

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
                    let declinedClaimer = data.status.user_id;

                    data.status = {
                        value: 'open',
                        user_id: '',
                        fullName: ''
                    };
                    data.provider = {
                        name: '',
                        id: ''
                    };
                    data.save((err, data) => {
                        if (err || !data) {
                            logger.error(`failed to decline claimer in activity: ${activityId} due to: ${err}`);
                            reject(false);
                        }
                        logger.info(`claimer: ${declinedClaimer} was declined in activity: ${activityId}`);
                        resolve(data);
                    });
                }
            });
    });
};

exports.finishActivity = (activityId) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.findOne({_id: {$eq: activityId}},
            (err, data) => {
                if (err) {
                    logger.error(`failed to finish activity: ${activityId} due to: ${err}`);
                    reject(false);
                }
                else if (!data) {
                    logger.warn(`cant finish non-existed activity: ${activityId}`);
                    resolve(null)
                }
                else {
                    data.status = {
                        value: (data.recurring.toLowerCase() === 'once') ? 'done' : 'ongoing',
                    };
                    data.save((err, data) => {
                        if (err || !data) {
                            logger.error(`failed to done activity: ${activityId} due to: ${err}`);
                            reject(false);
                        }
                        logger.debug(`activity: ${activityId} was finished`);
                        resolve(data);
                    });
                }
            });
    });
};

exports.vote = (activityId) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.findOne({_id: {$eq: activityId}},
            (err, data) => {
                if (err) {
                    logger.error(`failed to vote activity: ${activityId} due to: ${err}`);
                    reject(false);
                }
                else if (!data) {
                    logger.warn(`cant finish vote activity: ${activityId}`);
                    resolve(null)
                }
                else {
                    data.isVote = true;
                    data.save((err, data) => {
                        if (err || !data) {
                            logger.error(`failed to vote activity: ${activityId} due to: ${err}`);
                            reject(false);
                        }
                        logger.debug(`activity: ${activityId} was vote`);
                        resolve(data);
                    });
                }
            });
    });
};

exports.cancelActivity = (activityId) => {
    return new Promise((resolve, reject) => {
        ACTIVITY.findOne({_id: {$eq: activityId}},
            (err, data) => {
                if (err) {
                    logger.error(`failed to cancel activity: ${activityId} due to: ${err}`);
                    reject(false);
                }
                else if (!data) {
                    logger.warn(`cant cancel non-existed activity: ${activityId}`);
                    resolve(null)
                }
                else {
                    data.status = {
                        value: `cancelled`,
                        user_id: ``,
                        fullName: ``
                    };
                    data.provider = {
                        name: ``,
                        id: ``
                    };
                    data.save((err, data) => {
                        if (err || !data) {
                            logger.error(`failed to cancel activity: ${activityId} due to: ${err}`);
                            reject(false);
                        }
                        logger.debug(`activity: ${activityId} was cancelled`);
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

