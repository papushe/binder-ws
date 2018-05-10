let Activity = require('../models/Activity'),
    Utils = require('../utils'),
    activityService = require('../services/activityService'),
    userService = require('../services/userService'),
    logger = Utils.getLogger();

exports.create = (req, res) => {
    logger.info(`COMMUNITY ID: ${req.body.communityId}`);
    let activityObj = new Activity({
        activity_name: req.body.activityName,
        activity_description: req.body.activityDescription,
        type: req.body.type,
        created_at: Utils.now(),
        consumer: req.body.consumer,
        provider: req.body.provider,
        community_id: req.body.communityId,
        source: req.body.source,
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
    let communityId = req.params.key;
    activityService.getCommunityActivities(communityId)
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
        created_at: Utils.now(),
        consumer: req.body.consumer,
        provider: req.body.provider,
        community_id: req.body.communityId,
        source: req.body.source,
        destination: req.body.destination,
        activity_date: Utils.normalizeDate(req.body.activity_date),
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
    let {userId, activityId} = req.body;
    activityService.addToWaitingList(userId, activityId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        })

};

exports.approve = (req, res) => {
    let {userId, activityId} = req.body;

    userService.getUserProfile(userId)
        .then(user => {
            activityService.setProvider(user, activityId)
                .then(response => {
                    activityService.deleteAllClaims(activityId)
                        .then(response => {
                            res.json(response);
                        })
                        .catch(err => {
                            res.json(err);
                        })
                })
                .catch(err => {
                    res.json(err);
                })
        })
        .catch(err => {
            res.json(err);
        })
};

exports.deleteClaims = (req, res) => {
    let activityId = req.params.activityId;

    activityService.deleteAllClaims(activityId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        })
};