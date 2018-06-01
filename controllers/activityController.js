let Activity = require('../models/Activity'),
    Utils = require('../utils'),
    activityService = require('../services/activityService'),
    userService = require('../services/userService'),
    schedulerService = require('../services/schedulerService'),
    logger = Utils.getLogger(),
    next5Min = 5 * 60 * 1000;

exports.create = (req, res) => {
    let activityObj = new Activity({
        activity_name: req.body.activityName,
        activity_description: req.body.activityDescription,
        created_at: Utils.currentDateTimeInUTC(),
        recurring: req.body.recurring,
        consumer: req.body.consumer,
        provider: req.body.provider,
        community_id: req.body.communityId,
        source: req.body.source,
        status: {value: 'open', user_id: null, fullName: null},
        destination: req.body.destination,
        activity_date: req.body.activity_date,
        notes: req.body.notes
    });
    activityService.saveNewActivity(activityObj)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.getByUserId = (req, res) => {
    let userId = req.params.key;
    activityService.getUserActivities(userId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.getByCommunityId = (req, res) => {
    let {communityId, filters} = req.body;

    if (!filters || filters.length === 0) {
        filters = ['open', 'claimed', 'approved', 'live', 'done', 'ongoing', 'cancelled'];
    }

    activityService.getCommunityActivities(communityId, filters)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.deleteById = (req, res) => {
    let activityId = req.body.activityId;
    activityService.deleteActivityById(activityId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.update = (req, res) => {
    let activityObj = new Activity({
        activity_name: req.body.activityName,
        activity_description: req.body.activityDescription,
        consumer: req.body.consumer,
        provider: req.body.provider,
        recurring: req.body.recurring,
        community_id: req.body.communityId,
        source: req.body.source,
        destination: req.body.destination,
        activity_date: req.body.activity_date,
        notes: req.body.notes
    });
    let activityId = req.body.activityId;
    activityService.saveExistingActivity(activityObj, activityId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        })

};

exports.claim = (req, res) => {
    let {userId, fullName, activityId} = req.body;
    activityService.setClaimer(userId, fullName, activityId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        })

};

exports.decline = (req, res) => {
    let {activityId} = req.body;
    activityService.declineClaimer(activityId)
        .then(activity => {
            userService.deleteActivityFromUser(activity.status.user_id, activity._id)
                .then(user => {
                    res.json(activity);
                })
                .catch(err => {
                    res.json(err);
                });
        })
        .catch(err => {
            res.json(err);
        })
};

exports.approve = (req, res) => {
    let {activityId} = req.body;

    activityService.setProvider(activityId)
        .then(updateObj => {
            if (updateObj.success) {
                userService.addApprovedActivity(activityId, updateObj.activity.provider.id)
                    .then(updatedUser => {
                        if (updatedUser) {
                            schedulerService.createNewJob(updateObj.activity)
                                .then(job => {
                                    if (updateObj.activity.activity_date < next5Min) {
                                        schedulerService.execute(false);
                                    }
                                    Utils.sendEmail({
                                        to: updatedUser.email,
                                        subject: `${updateObj.activity.activity_name} was approved!`,
                                        body: `Activity ${updateObj.activity.activity_name} was approved by ${updateObj.activity.consumer.name}`
                                    });
                                    res.json(updateObj.activity);
                                })
                                .catch(err => {
                                    res.json(err);
                                });
                        }
                        else {
                            res.json(false);
                        }

                    }).catch(err => {
                    res.json(err);
                });
            }
            else {
                res.json(null);
            }
        })
        .catch(err => {
            res.json(err);
        });
};

exports.finish = (req, res) => {
    let {activityId} = req.body;
    activityService.finishActivity(activityId)
        .then(activity => {
            if (activity.recurring === 'once') {
                schedulerService.abortJob(activityId)
                    .then(job => {
                        res.json(activity);
                    })
                    .catch(err => {
                        res.json(err);
                    });
            }
            else {
                res.json(activity);
            }
        })
        .catch(err => {
            res.json(err);
        })
};

exports.cancel = (req, res) => {
    let {activityId, providerId} = req.body;
    userService.deleteActivityFromUser(providerId, activityId)
        .then(consumerObj => {
            activityService.cancelActivity(activityId)
                .then(activity => {
                    schedulerService.abortJob(activityId)
                        .then(job => {
                            res.json(activity);
                        })
                        .catch(err => {
                            res.json(err);
                        });
                })
                .catch(err => {
                    res.json(err);
                })
        })
        .catch(err => {
            res.json(err);
        });
};