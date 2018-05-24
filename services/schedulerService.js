let schedule = require('node-schedule'),
    JOB = require('../models/Job'),
    Promise = require('promise'),
    Utils = require('../utils'),
    logger = Utils.getLogger(),
    activityService = require('../services/activityService'),
    RETRIES_COUNT = 3,
    NOT_EXECUTED_STATE = 'not_executed',
    PENDING_STATE = 'pending',
    DONE_STATE = 'done',
    IO = require('../socket/socketService');

exports.getJobsToExecute = () => {
    let currentUnixTime = new Date().getTime();
    let unix5MinAgo = currentUnixTime - (5 * 60 * 1000);
    let unix5MinNext = currentUnixTime + (5 * 60 * 1000);

    let activities = [];
    let jobs = [];
    let promises = [];

    return new Promise((resolve, reject) => {
        JOB.find({
                $and: [

                    {execution_date: {$gte: unix5MinAgo}},
                    {execution_date: {$lt: unix5MinNext}},
                    {status: {$eq: PENDING_STATE}}
                ]
            },
            (err, data) => {
                if (err) {
                    logger.error(`failed to fetch pending jobs from ${Utils.unixToLocal(unix5MinAgo)} due to : ${err}`);
                    reject(err);
                }
                if (!data) {
                    logger.warn(`cant find pending jobs to execute from: ${Utils.unixToLocal(unix5MinAgo)}`);
                    resolve(activities);
                }
                else {
                    data.forEach(job => {
                        job.status = DONE_STATE;
                        jobs.push(job._id);
                        activities.push(job.activity_id);
                        promises.push(job.save());
                    });

                    Promise.all(promises)
                        .then(data => {
                            logger.info(`ready to execute these jobs: ${JSON.stringify(jobs)}`);
                            resolve(activities);
                        })
                        .catch(err => {
                            logger.error(`failed to execute these jobs: ${JSON.stringify(jobs)} due to: ${err}`);
                            reject(err);
                        });
                }

            });
    })
};

exports.scheduleAction = (updatedActivity, action) => {
    let activity = updatedActivity;
    let activityLocalDateTime;
    let job;

    return new Promise((resolve, reject) => {
        try {
            if (!activity) {
                logger.error(`Failed to create a new job because Activity obj is undefined!`);
                reject(false);
            }

            activityLocalDateTime = Utils.unixToUTC(activity.activity_date);

            if (Utils.isAfter(activity.activity_date)) {
                logger.error(`Job creation is ignored! Activity execution time is: ${activityLocalDateTime} UTC! while now the time is: ${Utils.currentDateTimeInUTC()} UTC`);
                resolve(null);
            }
            else {
                job = schedule.scheduleJob(new Date(activity.activity_date), action);

                storeScheduledActivityInDB(activity)
                    .then(job => {
                        logger.info(`Job has been scheduled on ${activityLocalDateTime} UTC for activity: ${activity._id}`);
                        resolve(job);
                    })
                    .catch(err => {
                        logger.error(`Failed to store activity: ${activity._id} in DB after ${RETRIES_COUNT} times due to: ${err}`);
                        reject(false);
                    });
            }
        } catch (e) {
            logger.error(`Failed to schedule a job for activity: ${activity._id} due to: ${e}`);
            reject(false);
        }
    });
};

exports.handleCorruptedJobs = () => {
    let unix5MinAgo = new Date().getTime() - (5 * 60 * 1000);
    let activities = [];
    let jobs = [];
    let promises = [];

    return new Promise((resolve, reject) => {
        JOB.find({
                $and: [

                    {execution_date: {$lt: unix5MinAgo}},
                    {status: {$ne: DONE_STATE}},
                    {status: {$ne: NOT_EXECUTED_STATE}},
                ]
            },
            (err, data) => {
                if (err) {
                    logger.error(`failed to find corrupted jobs to eliminate since ${Utils.unixToLocal(unix5MinAgo)} due to : ${err}`);
                    reject(err);
                }
                if (!data) {
                    logger.warn(`cant find corrupted jobs to eliminate since ${Utils.unixToLocal(unix5MinAgo)} `);
                    resolve(activities);
                }
                else {
                    data.forEach(job => {
                        job.status = NOT_EXECUTED_STATE;

                        jobs.push(job._id);
                        activities.push(job.activity_id);
                        promises.push(activityService.updateActivityStatus(job.activity_id, 'ignored'));
                        promises.push(job.save());
                    });
                    Promise.all(promises)
                        .then(data => {
                            logger.warn(`eliminating these corrupted jobs: ${JSON.stringify(jobs)}`);
                            resolve();
                        })
                        .catch(err => {
                            logger.warn(`failed tp eliminate these corrupted jobs: ${JSON.stringify(jobs)} due to: ${err}`);
                            reject(err);
                        });
                }
            });
    });
};

storeScheduledActivityInDB = (activity) => {
    let job = new JOB({
        activity_id: activity._id,
        status: 'pending',
        created_at: new Date().getTime(),
        consumer: activity.consumer,
        provider: activity.provider,
        execution_date: activity.activity_date,
    });

    return new Promise((resolve, reject) => {
        job.save((err, data) => {
            if (err) {
                logger.error(`Failed to store Job: ${job} in db due to: ${err}`);
                reject(err);
            }
            else {
                logger.info(`Job ${job} was stored successfully`);
                resolve(data);
            }
        })
    });
};

exports.execute = () => {
    let promises = [];
    return new Promise((resolve, reject) => {
        this.handleCorruptedJobs()
            .then(() => {
                this.getJobsToExecute()
                    .then(executedActivities => {
                        if (!executedActivities && executedActivities.length === 0) {
                            resolve([]);
                        } else {
                            executedActivities.forEach(activityId => {
                                promises.push(activityService.updateActivityStatus(activityId, 'live'));
                            });

                            Promise.all(promises)
                                .then(activitiesObjList => {
                                    activitiesObjList.forEach(activity => {

                                        IO.sendNotification(activity, 'onActivityStartConsumer');
                                        IO.sendNotification(activity, 'onActivityStartProvider');

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
                        logger.error(`failed to executed jobs with related activities due to: ${err}`);
                        reject(err);
                    });
            })
            .catch(err => {
                logger.error(`failed to clean corrupted jobs due to: ${err}`);
                reject(err);
            });
    });
};


