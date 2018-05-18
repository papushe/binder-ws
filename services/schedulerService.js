let schedule = require('node-schedule'),
    JOB = require('../models/Job'),
    Promise = require('promise'),
    Utils = require('../utils'),
    logger = Utils.getLogger(),
    RETRIES_COUNT = 3;

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
                    logger.warn(`activity execution time: ${activityLocalDateTime} UTC! \n now the time is: ${Utils.currentDateTimeInUTC()}`);
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

