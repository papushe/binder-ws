let Activity = require('../models/Activity'),
    activityService = require('../services/activityService'),
    userService = require('../services/userService'),
    schedulerService = require('../services/schedulerService');

exports.create = (req, res) => {
    let activityObj = new Activity({
        activity_name: req.body.activityName,
        activity_description: req.body.activityDescription,
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

exports.vote = (req, res) => {
    let activityId = req.body.activityId;
    activityService.vote(activityId)
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
    let NEXT_FIVE_MIN = new Date().getTime() + (5 * 60 * 1000);

    activityService.setProvider(activityId)
        .then(updateObj => {
            if (updateObj.success) {
                userService.addApprovedActivity(activityId, updateObj.activity.provider.id)
                    .then(updatedUser => {
                        if (updatedUser) {
                            schedulerService.createNewJob(updateObj.activity)
                                .then(job => {
                                    if (updateObj.activity.activity_date < (NEXT_FIVE_MIN)) {
                                        schedulerService.execute(false);
                                    }
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
            if (activity.recurring.toLowerCase() === 'once') {
                schedulerService.abortJob(activityId)
                    .then(job => {
                        activityService.updateActivityStatus(activity._id, 'done')
                            .then(activity => {
                                res.json(activity);
                            })
                            .catch(err => {
                                res.json(err);
                            })
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