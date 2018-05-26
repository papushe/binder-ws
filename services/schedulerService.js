let schedule = require('node-schedule'),
    JOB = require('../models/Job'),
    Promise = require('promise'),
    Utils = require('../utils'),
    logger = Utils.getLogger(),
    activityService = require('../services/activityService'),
    sockets = require('../socket/socketService'),

    PENDING_STATE = 'pending',
    DONE_STATE = 'done',

    DAY = 24 * 60 * 60 * 1000,
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

                    {"execution_time.next": {$gte: unix5MinAgo}},
                    {"execution_time.next": {$lt: unix5MinNext}},
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
                        if (!job.recurring || job.recurring === 'once') {
                            job.status = DONE_STATE;
                        }
                        else if (job.recurring === 'daily') {
                            job.execution_time.next += DAY;
                        }
                        else if (job.recurring === 'weekly') {
                            job.execution_time.next += 7 * DAY;
                        }
                        else if (job.recurring === 'monthly') {
                            let previous = new Date(job.execution_time.next);
                            job.execution_time.next = new Date(previous.getFullYear(), previous.getMonth() + 1, previous.getDate(), previous.getHours(), previous.getMinutes()).getTime();
                        }
                        jobs.push(job._id);
                        activities.push(job.activity_id);
                        promises.push(job.save());
                    });

                    Promise.all(promises)
                        .then(data => {
                            logger.debug(`going to execute jobs: ${JSON.stringify(jobs)}`);
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

exports.scheduleAction = (timeToExecuteEpoch, action) => {
    let localExecutionTime;
    let job;

    try {
        localExecutionTime = Utils.unixToUTC(timeToExecuteEpoch);

        if (Utils.isAfter(timeToExecuteEpoch)) {
            logger.error(`Cant schedule ${action.name} action on: ${localExecutionTime} UTC! while now the time is: ${Utils.currentDateTimeInUTC()} UTC`);
            return false;
        }
        else {
            job = schedule.scheduleJob(new Date(timeToExecuteEpoch), action);
            return job;
        }
    } catch (e) {
        logger.error(`Failed to schedule a job for activity: ${activity._id} due to: ${e}`);
        return false;
    }
};

exports.cleanJobs = () => {
    return new Promise((resolve, reject) => {
        //running once a week on Saturday
        if (new Date().getDay() !== 6) {
            resolve();
        }
        else {
            JOB.remove({
                    $and: [
                        {"execution_time.next": {$eq: -1}},
                        {status: {$ne: PENDING_STATE}},
                    ]
                },
                (err, data) => {
                    if (err) {
                        logger.error(`failed to run clean jobs due to : ${err}`);
                    }
                    else {
                        logger.info(`cleaning jobs task done...`);
                    }
                    resolve();
                });
        }
    });
};

exports.cancelJobs = (activityId) => {
    return new Promise((resolve, reject) => {
        JOB.findOne({activity_id: {$eq: activityId}},
            (err, data) => {
                if (err) {
                    logger.error(`Failed to cancel job for activity: ${activityId} due to: ${err}`);
                    reject(err);
                }
                else if (!data) {
                    logger.warn(`cant cancel non-existed job for activity: ${activityId}`);
                    resolve(null);
                }
                else {
                    data.status = `done`;
                    data.execution_time.next = -1;

                    data.save((err, data) => {
                        logger.info(`Job ${data._id} is cancelled for activity ${activityId}`);
                        resolve(data);
                    });
                }
            })
    });
};

exports.abortJob = (activityId) => {
    return new Promise((resolve, reject) => {
        JOB.findOne({activity_id: {$eq: activityId}},
            (err, data) => {
                if (err) {
                    logger.error(`Failed to abort job for activity: ${activityId} due to: ${err}`);
                    reject(err);
                }
                else if (!data) {
                    logger.warn(`cant abort non-existed job for activity: ${activityId}`);
                    resolve(null);
                }
                else {
                    data.status = `done`;
                    data.execution_time.next = -1;

                    data.save((err, data) => {
                        logger.info(`Job ${data._id} is aborted for activity ${activityId}`);
                        resolve(data);
                    });
                }
            })
    });
};

exports.createNewJob = (activity) => {
    let job = new JOB({
        activity_id: activity._id,
        status: 'pending',
        created_at: new Date().getTime(),
        consumer: activity.consumer,
        provider: activity.provider,
        recurring: activity.recurring,
        execution_time: {
            first: activity.activity_date,
            next: activity.activity_date,
        }
    });

    return new Promise((resolve, reject) => {
        job.save((err, data) => {
            if (err) {
                logger.error(`Failed to create Job: ${job} due to: ${err}`);
                reject(err);
            }
            else {
                logger.info(`Job ${job} was created successfully`);
                resolve(data);
            }
        })
    });
};

exports.execute = () => {
    let promises = [];
    let NEXT_FIVE_MIN = new Date().getTime() + (5 * 60 * 1000);

    //scheduling next iteration
    logger.info(`jobs execution started...`);
    this.scheduleAction(NEXT_FIVE_MIN, this.execute);

    return new Promise((resolve, reject) => {
        this.cleanJobs()
            .then(() => {
                this.getJobsToExecute()
                    .then(executedActivities => {
                        if (!executedActivities && executedActivities.length === 0) {
                            resolve([]);
                        }
                        else {
                            executedActivities.forEach(activityId => {
                                promises.push(activityService.updateActivityStatus(activityId, 'live'));
                            });

                            Promise.all(promises)
                                .then(activitiesObjList => {
                                    activitiesObjList.forEach(activity => {
                                        sockets.sendNotification(activity, 'onActivityStartConsumer');
                                        sockets.sendNotification(activity, 'onActivityStartProvider');
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
                        logger.error(`job execution failed due to: ${err}`);
                        reject(err);
                    });
            })
            .catch(err => {
                logger.error(`job cleaning failed due to: ${err}`);
            });

    });
};


