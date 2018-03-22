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
      source: {
          city: req.body.sourceCity,
          street: req.body.sourceStreet,
          number: req.body.sourceNumber
      },
      destination: {
          city: req.body.destCity,
          street: req.body.destStreet,
          number: req.body.destNumber
      },
      activity_date: req.body.activityDate,
      notes: req.body.notes
  });
  newActivity.save(
      (err, data) => {
          if (err) res.json(err);
          else res.json(data);
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