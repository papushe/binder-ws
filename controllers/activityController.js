let Activity = require('../models/Activity'),
    Utils = require('../utils');

exports.errorHandling = (req, res) => {
    res.json('Error occurred!')
};

exports.createNewActivity = (req, res) => {
  let newActivity = new Activity({
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
  newActivity.save(
      (err, data) => {
          if (err) {
              console.log(`Failed to create activity: ${newActivity} due to: ${err}`);
              res.json(err);
          }
          else {
              console.log(`Activity: ${data._id} was created successfully!`);
              res.json(data);
          }
      }
  );
};

exports.getActivitiesByUserId = (req, res) => {
    Activity.find({$or: [{consumer_id: {$eq: req.params.key}}, {provider_id: {$eq: req.params.key}}]},
    (err, data) => {
        if (err) {
            res.json(err);
        }
        res.json(data);
    });
};

exports.getActivitiesByCommunityId = (req, res) => {
    Activity.find({community_id: {$eq: req.params.key}},
        (err, data) => {
            if (err) {
                res.json(err);
            }
            res.json(data);
        });
};

exports.deleteActivityById = (req, res) => {
    Activity.deleteOne({_id: {$eq: req.body.activityId}},
        (err, data) => {
            if (err) res.json(err);
            res.json(data);
        });
};