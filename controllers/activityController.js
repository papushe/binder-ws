let Activity = require('../models/Activity'),
    Utils = require('../utils'),
    activityService = require('../services/activityService'),
    userService = require('../services/userService'),
    schedulerService = require('../services/schedulerService'),
    logger = Utils.getLogger();

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
        filters = ['open', 'claimed', 'approved', 'live', 'done', 'ignored'];
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
                            schedulerService.scheduleAction(updateObj.activity, schedulerService.execute)
                                .then(job => {
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
