let schedule = require('node-schedule'),
    Utils = require('../utils');

exports.scheduleAction = (date, action) => {
    schedule.scheduleJob(date, action());
};