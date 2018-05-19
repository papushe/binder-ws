let schedule = require('node-schedule'),
    JOB = require('../models/Job'),
    Promise = require('promise'),
    Utils = require('../utils'),
    logger = Utils.getLogger(),
    RETRIES_COUNT = 3,
    DONE_STATE = 'done';

exports.getJobsToExecute = () => {
    let activities = [];
    let jobs = [];
    let currentUnixTime = new Date().getTime();
    let unixTime2MinAgo =  currentUnixTime - (120 * 1000);
    let unixNext2Min = currentUnixTime + (120 * 1000);

    /**
     *
     * I should filter jobs which have already executed!
     * */
    JOB.find({$and: [{execution_date: {$gt: unixTime2MinAgo, $lt:unixNext2Min}}, {status: {$ne: DONE_STATE}}]},
        (err, data) => {
            if (err) {
                logger.error(`failed to fetch jobs from: ${Utils.unixToLocal(unixTime2MinAgo)} to: ${Utils.unixToLocal(unixNext2Min)} due to : ${err}`);
                reject(err);
            }
            if (!data) {
                logger.warn(`cant find jobs to execute from: ${Utils.unixToLocal(unixTime2MinAgo)} to: ${Utils.unixToLocal(unixNext2Min)}`);
                resolve(activities);
            }
            else {
                data.forEach(job => {
                    job.status = DONE_STATE;
                    jobs.push(job._id);
                    activities.push(job.activity_id);
                });
                data.save((err,data) => {
                    if (err) {
                        logger.error(`failed to save jobs new state: ${DONE_STATE} due to: ${err}`);
                        reject(err);
                    }
                    else {
                        logger.info(`Executing jobs: ${jobs}`);
                        resolve(activities);
                    }
                })
            }
        });
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

                if (Utils.isAfterUTC(activityLocalDateTime)) {
                    logger.warn(`Activity execution time: ${activityLocalDateTime} UTC! now the time is: ${Utils.currentDateTimeInUTC()} UTC`);
                    resolve(null);
                }
                else {
                    job = schedule.scheduleJob(activityLocalDateTime, action);
                    storeScheduledActivityInDB(activity)
                        .then(job => {
                            logger.info(`Job has been scheduled on ${activityLocalDateTime} UTC for activity: ${activity._id}`);
                            resolve(job);
                        }).catch(err => {
                        logger.error(`Failed to store activity: ${activity._id} in DB after ${RETRIES_COUNT} times due to: ${err}`);
                        reject(false);
                    });
                }
            }catch (e) {
                logger.error(`Failed to schedule a job for activity: ${activity._id} due to: ${e}`);
                reject(false);
            }
        });
};

storeScheduledActivityInDB = (activity) => {

    let job = new JOB( {
        activity_id: activity._id,
        status: 'pending',
        created_at: Utils.currentDateTimeInUTC(),
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


