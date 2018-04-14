let Activity = require('../models/Activity'),
    Utils = require('../utils'),
    activityService = require('../services/activityService');

exports.errorHandling = (req, res) => {
    res.json('Error occurred!')
};

exports.createNewActivity = (req, res) => {
  let activityObj = new Activity({
      activity_name: req.body.acitivityName,
      activity_description: req.body.activityDescription,
      type: req.body.type,
      created_at: Utils.now(),
      consumer_id: req.body.consumerId,
      provider_id: req.body.providerId,
      community_id: req.body.communityId,
      source: req.body.source,
      destination: req.body.destination,
      activity_date: req.body.activityDate,
      notes: req.body.notes
  });
  activityService.saveNewActivity(activityObj)
        .then(response => {
            res.json(response);
        })
        .catch(reject => {
          res.json(reject);
        });
};

exports.getActivitiesByUserId = (req, res) => {
    let userId = req.params.key;
    activityService.getUserActivities(userId)
        .then(response => {
            res.json(response);
        })
        .catch(reject => {
            res.json(reject);
        });
};

exports.getActivitiesByCommunityId = (req, res) => {
    let communityId = req.params.key;
    activityService.getCommunityActivities(communityId)
        .then(response => {
            res.json(response);
        })
        .catch(reject => {
            res.json(reject);
        });
};

exports.deleteActivityById = (req, res) => {
    let activityId = req.body.activityId;
    activityService.deleteActivityById(activityId)
        .then(response => {
            res.json(response);
        })
        .catch(reject => {
            res.json(reject);
        });
};