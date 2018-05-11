let Activity = require('../models/Activity'),
    Utils = require('../utils'),
    activityService = require('../services/activityService'),
    schedulerService = require('../services/schedulerService'),
    logger = Utils.getLogger();

exports.create = (req, res) => {
    let activityObj = new Activity({
        activity_name: req.body.activityName,
        activity_description: req.body.activityDescription,
        type: req.body.type,
        created_at: Utils.currentDateTimeInUTC(),
        consumer: req.body.consumer,
        provider: req.body.provider,
        community_id: req.body.communityId,
        source: req.body.source,
        status: {value: 'open', user_id: null, fullName: null},
        destination: req.body.destination,
        activity_date: Utils.normalizeDate(req.body.activity_date),
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
        filters = ['open', 'claimed', 'approved'];
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
        type: req.body.type,
        consumer: req.body.consumer,
        provider: req.body.provider,
        community_id: req.body.communityId,
        source: req.body.source,
        destination: req.body.destination,
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
    let {userId,fullName, activityId} = req.body;
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
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        })

};

exports.approve = (req, res) => {
    let {activityId} = req.body;

    activityService.setProvider(activityId)
        .then(response => {
            /***
             * we should replace third argument of empty function with a reference of
             * function we actually want to run when activity time arrives.
             *
             * e.g send an update notification to all activity participants
             * */
            schedulerService.scheduleAction(activityId, response.activity_date, function () {
                console.log(`Hi I am the action which suppose to run at ${response.activity_date}`);
            })
                .then(result => {
                    res.json(response);

                })
                .catch(err => {
                    res.json(err);
                });
        })
        .catch(err => {
            res.json(err);
        });

};