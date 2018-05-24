let testUtils = require('./testUtils'),
    testedService = require('../services/activityService'),
    userService = require('../services/userService'),
    Activity = require('../models/Activity'),
    testUser = testUtils.user,
    utils = require('../utils'),
    logger = utils.getLogger(),
    chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    mongoose = require('../database'),
    testUniqueId,
    tomorrow = new Date().getTime() + (24 * 60 * 60 * 1000),
    activity,
    activities = [],
    member = {
        firstName: 'Naor',
        lastName: 'Mailinator',
        keyForFirebase: 'RJKAEPE0Cog4oZRIiSGtHus2X0g1'
    };

describe(`Activity Service Integration Tests`, () => {

    before(async () => {
        let promises = [];
        //clean old tests activities and references
        logger.info(`activityServiceIT started at: ${utils.now()}`);
        testUniqueId = `test ${new Date().getTime()}`;
        let result = await userService.getUserProfile(testUser.USER_KEY);

        if (result) {
            result.activities = [];
            result = await userService.updateUserProfile(result);
            logger.info(`deleted old activities success? ${!!result}`);
        }
    });

    after(async () => {
        let promises = [];
        //clean test activities and references
        activities.forEach(activity => {
            promises.push(userService.deleteActivityFromUser(testUser.USER_KEY, activity._id));
            promises.push(testedService.deleteActivityById(activity._id));
        });
        let result = await Promise.all(promises);

        logger.info(`removed all test activities? ${!!result}`);
        logger.info(`activityServiceIT ended at: ${utils.now()}`);
    });

    it(`should create a new activity`, async () => {
         activity = new Activity({
            activity_name: `activity-name`,
            activity_description: `description`,
            type: `dog-walker`,
            consumer: {name: testUser.USER_NAME, id: testUser.USER_KEY},
            community_id: testUniqueId,
            source: `source`,
            destination: `destination`,
            activity_date: tomorrow,
            notes: `my notes`
        });

        let result = await testedService.saveNewActivity(activity);

        activities.push(result);

        expect(result.activity_name).equal(`activity-name`);
        expect(result.activity_description).equal(`description`);
        expect(result.type).equal(`dog-walker`);
        expect(result.consumer.name).equal(testUser.USER_NAME);
        expect(result.consumer.id).equal(testUser.USER_KEY);
        expect(result.community_id).equal(testUniqueId);
        expect(result.source).equal(`source`);
        expect(result.destination).equal(`destination`);
        expect(result.notes).equal(`my notes`);

    });

    it(`should update an existed activity`, async () => {
        activity = new Activity({
            activity_name: `activity-name2`,
            activity_description: `description2`,
            type: `dog-walker2`,
            consumer: {name: testUser.USER_NAME, id: testUser.USER_KEY},
            community_id: testUniqueId,
            source: `source2`,
            destination: `destination2`,
            activity_date: tomorrow,
            notes: `my notes2`
        });

        let result = await testedService.saveExistingActivity(activity, activity._id.toString());

        expect(result.activity_name).equal(`activity-name2`);
        expect(result.activity_description).equal(`description2`);
        expect(result.type).equal(`dog-walker2`);
        expect(result.consumer.name).equal(testUser.USER_NAME);
        expect(result.consumer.id).equal(testUser.USER_KEY);
        expect(result.community_id).equal(testUniqueId);
        expect(result.source).equal(`source2`);
        expect(result.destination).equal(`destination2`);
        expect(result.notes).equal(`my notes2`);
    });


    it(`should get user activities`, async () => {
        let result = await testedService.getUserActivities(testUser.USER_KEY);

        expect(result).not.equal(false);
        expect(result).not.equal(null);
        result.should.be.an('array').with.lengthOf(1);
    });

    it(`should get community activities with filter`, async () => {
        let result = await testedService.getCommunityActivities(testUniqueId, ['open']);
        expect(result.status.value).equal('open');
    });

    it(`should get activity by id`, async () => {
        let result = await testedService.getActivityById(activities[0]._id);
        expect(result._id.toString()).equal(activities[0]._id.toString());
    });

    it(`should set a claimer`, async () => {
        let result = await testedService.setClaimer(testUser.USER_KEY, testUser.USER_NAME, activities[0]._id);
        expect(result._id.toString()).equal(activities[0]._id.toString());
        expect(result.status.user_id).equal(testUser.USER_KEY);
        expect(result.status.fullName).equal(testUser.USER_NAME);
        expect(result.status.value).equal('claimed');
    });

    it(`should decline the claimer`, async () => {
        let result = await testedService.declineClaimer(activities[0]._id);
        expect(result._id.toString()).equal(activities[0]._id.toString());
        expect(result.status.user_id).equal('');
        expect(result.status.fullName).equal('');
        expect(result.status.value).equal('open');
    });

    it(`should set the claimer as provider`, async () => {
        let result = await testedService.setClaimer(testUser.USER_KEY, testUser.USER_NAME, activities[0]._id);
        result = await testedService.setProvider(activities[0]._id);
        expect(result._id.toString()).equal(activities[0]._id.toString());
        expect(result.status.user_id).equal('');
        expect(result.status.fullName).equal('');
        expect(result.status.value).equal('approved');
        expect(result.provider).equal({name: testUser.USER_NAME, id: testUser.USER_KEY});

    });

    it(`should delete user 'approved' activities`, async () => {
        let result = await testedService.deleteUserActivities(testUser.USER_KEY, testUniqueId, ['approved']);
        result = await testedService.getActivityById(activities[0]._id);
        result.should.be.an('array').with.lengthOf(0);
    });
});