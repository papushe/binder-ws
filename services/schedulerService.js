let schedule = require('node-schedule'),
    JOB = require('../models/Job'),
    Promise = require('promise'),
    Utils = require('../utils'),
    logger = Utils.getLogger(),
    RETRIES_COUNT = 3;

exports.getJobsToExecute = () => {
    let activities = [];
    let currentUnixTime = new Date().getTime();
    let unixTime5MinAgo =  currentUnixTime - (300 * 1000);
    let unixNext5Min = currentUnixTime + (300 * 1000);

    /**
     *
     * I should filter jobs which have already executed!
     * */
    JOB.find({execution_date: {$gt: unixTime5MinAgo, $lt:unixNext5Min}},
        (err, data) => {
            if (err) {
                logger.error(`failed to fetch jobs from: ${Utils.unixToLocal(unixTime5MinAgo)} to: ${Utils.unixToLocal(unixTime5MinAgo)}`)
                reject(err);
            }
            if (!data) {
                logger.warn(`cant find jobs to execute from: ${Utils.unixToLocal(unixTime5MinAgo)} to: ${Utils.unixToLocal(unixTime5MinAgo)}`);
                resolve(activities);
            }
            else {
                data.forEach(job => {
                    activities.push(job.activity_id);
                });
                resolve(activities)
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

                activityLocalDateTime = Utils.UTCTimeToLocalDateTime(activity.activity_date);

                if (Utils.isAfterUTC(activityLocalDateTime)) {
                    logger.warn(`Activity execution time: ${activityLocalDateTime} UTC! now the time is: ${Utils.currentDateTimeInUTC()} UTC`);
                    resolve(null);
                }
                else {
                    job = schedule.scheduleJob(activityLocalDateTime, action);
                    storeScheduledActivityInDB(activity)
                        .then(job => {
                            logger.info(`Job has been scheduled on ${activity.activity_date} UTC for activity: ${activity._id}`);
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
        execution_date: Utils.getUnixTime(activity.activity_date),
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


