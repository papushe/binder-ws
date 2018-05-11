let schedule = require('node-schedule'),
    Promise = require('promise'),
    Utils = require('../utils'),
    logger = Utils.getLogger();

exports.scheduleAction = (activityId, dateTimeUTC, action) => {
    let localDateTime = Utils.UTCTimeToLocalDateTime(dateTimeUTC);

    return new Promise((resolve, reject) => {
            try {
                schedule.scheduleJob(localDateTime, action());
                logger.info(`Job has been scheduled on ${dateTimeUTC} UTC for activity: ${activityId}`);
                resolve(true);
            }catch (e) {
                logger.error(`Failed to schedule a job for activity: ${activityId} due to: ${e}`);
                reject(false);
            }
        });
};