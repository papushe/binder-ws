let Activity = require('../models/Activity'),
    Utils = require('../utils'),
    activityService = require('../services/activityService'),
    userService = require('../services/userService');

exports.createNewActivity = (req, res) => {
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
      activity_date: req.body.activity_date,
      notes: req.body.notes
  });

  userService.getUserProfile(activityObj.consumer.id).then(response => {
      if (!response) {
          console.error(`failed to find consumer with id: ${activityObj.consumer.id}`);
          reject(false);
      }
      activityObj.consumer.name = `${response.firstName} ${response.lastName}`;
      activityService.saveNewActivity(activityObj)
          .then(response => {
              res.json(response);
          })
          .catch(err => {
              res.json(err);
          });
  });
};

exports.getActivitiesByUserId = (req, res) => {
    let userId = req.params.key;
    activityService.getUserActivities(userId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.getActivitiesByCommunityId = (req, res) => {
    let communityId = req.params.key;
    activityService.getCommunityActivities(communityId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};

exports.deleteActivityById = (req, res) => {
    let activityId = req.body.activityId;
    activityService.deleteActivityById(activityId)
        .then(response => {
            res.json(response);
        })
        .catch(err => {
            res.json(err);
        });
};