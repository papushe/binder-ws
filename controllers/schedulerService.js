let schedule = require('node-schedule'),
    Utils = require('../utils');

exports.scheduleAction = (dateTimeUTC, action) => {
    let localDateTime = Utils.UTCTimeToLocalDateTime(dateTimeUTC);
    schedule.scheduleJob(localDateTime, action());
};