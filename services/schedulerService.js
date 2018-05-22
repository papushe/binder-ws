let schedule = require('node-schedule'),
    JOB = require('../models/Job'),
    Promise = require('promise'),
    Utils = require('../utils'),
    logger = Utils.getLogger(),
    RETRIES_COUNT = 3,
    NOT_EXECUTED_STATE = 'not_executed',
    PENDING_STATE = 'pending',
    DONE_STATE = 'done';

exports.getJobsToExecute = () => {
    let activities = [];
    let jobs = [];
    let currentUnixTime = new Date().getTime();
    let unix2MinAgo = currentUnixTime - (120 * 1000);

    return new Promise((resolve, reject) => {
        JOB.find({
                $and: [

                    {execution_date: {$gt: unix2MinAgo}},
                    {status: {$eq: PENDING_STATE}}

                ]
            },
            (err, data) => {
                if (err) {
                    logger.error(`failed to fetch pending jobs from ${Utils.unixToLocal(unix2MinAgo)} due to : ${err}`);
                    reject(err);
                }
                if (!data) {
                    logger.warn(`cant find pending jobs to execute from: ${Utils.unixToLocal(unix2MinAgo)}`);
                    resolve(activities);
                }
                else {
                    data.forEach(job => {
                        job.status = DONE_STATE;
                        jobs.push(job._id);
                        activities.push(job.activity_id);
                    });
                    data.save((err, data) => {
                        if (err) {
                            logger.error(`failed to save jobs: ${jobs} new state: ${DONE_STATE} due to: ${err}`);
                            reject(err);
                        }
                        else {
                            logger.info(`Executing jobs: ${jobs}`);
                            resolve(activities);
                        }
                    })
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
    let unix2MinAgo = new Date().getTime() - (2 * 60 * 1000);
    let activities = [];
    let jobs = [];

    return new Promise((resolve, reject) => {
        JOB.find({
                $and: [

                    {execution_date: {$lt: unix2MinAgo}},
                    {status: {$eq: PENDING_STATE}},
                ]
            },
            (err, data) => {
                if (err) {
                    logger.error(`failed to find corrupted jobs to eliminate since ${Utils.unixToLocal(unix2MinAgo)} due to : ${err}`);
                    reject(err);
                }
                if (!data) {
                    logger.warn(`cant find corrupted jobs to eliminate since ${Utils.unixToLocal(unix2MinAgo)} `);
                    resolve(activities);
                }
                else {
                    data.forEach(job => {
                        job.status = NOT_EXECUTED_STATE;
                        jobs.push(job._id);
                        activities.push(job.activity_id);
                    });
                    data.save((err, data) => {
                        if (err) {
                            logger.error(`failed to save jobs: ${jobs} new state: ${NOT_EXECUTED_STATE} due to: ${err}`);
                            reject(err);
                        }
                        else {
                            logger.warn(`Not executing and eliminating these jobs: ${jobs}`);
                            resolve(activities);
                        }
                    })
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


