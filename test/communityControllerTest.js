let mongoose = require("mongoose");
let Community = require('../models/Community');
let testUtils = require('./testUtils');
let utils = require('../utils');

let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();

let communitiesDictionary = [];

let testUniqueId;

chai.use(chaiHttp);

function createCommunity(name, type) {
    return new Promise((resolve, reject) => {
        chai.request(testUtils.BASE_URL)
            .post(`/createNewCommunity/`)
            .send({
                'communityName': name || 'test' + new Date().getTime(),
                'communityDescription': 'description',
                'managerId': testUtils.USER_KEY,
                'creationDate': utils.now(),
                'members': null,
                'type': type || 'public'
            })
            .end((err, res) => {
                if (err) reject();
                resolve(res);
            });
    });
}

function storeTestCommunities(communities) {
    return new Promise((resolve) => {
        communities.forEach((c) => {
            communitiesDictionary[c.type] = c._id;
        });
        resolve();
    });
}

describe(`Community Controller Tests`, () => {

    before((done) => {
        testUniqueId = utils.getRandomString(5) + new Date().getTime();
        chai.request(testUtils.BASE_URL)
            .get(`/deleteCommunities/${testUtils.USER_KEY}`)
            .end((err, res) => {
                res.should.have.status(testUtils.STATUS_OK);
                done()
            });
    });


    after((done) => {
        chai.request(testUtils.BASE_URL)
            .get(`/deleteCommunities/${testUtils.USER_KEY}`)
            .end((err, res) => {
                res.should.have.status(testUtils.STATUS_OK);
                done()
            });
    });


    it(`it should POST createNewCommunity`, (done) => {
        createCommunity('public' + testUniqueId, 'Public')
            .then(() => {
                createCommunity('private' + testUniqueId, 'Private')
                    .then(() => {
                        createCommunity('secured' + testUniqueId, 'Secured')
                            .then(() => {
                                done();
                            });
                    });
            });
    });

    it(`it should GET getCommunities by user key`, (done) => {
        chai.request(testUtils.BASE_URL)
            .get(`/getCommunities/${testUtils.USER_KEY}`)
            .end((err, res) => {
                res.should.have.status(testUtils.STATUS_OK);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(3);
                storeTestCommunities(res.body)
                    .then(() => {
                        done()
                    });
            });
    });

    it(`it should POST leaveCommunity and leave the public community`, (done) => {
        chai.request(testUtils.BASE_URL)
            .post(`/leaveCommunity/`)
            .send({
                'communityId': communitiesDictionary['Public'],
                'uid': testUtils.USER_KEY,
            })
            .end((err, res) => {
                res.should.have.status(testUtils.STATUS_OK);
                res.body.should.be.eql(true);
                done()
            });
    });

    /**TODO:
     * in the future need to add more users to the community,
     * and check that the authorized member becomes the manager after the first user leaves the community
     * */


    it(`it should GET searchCommunity by community name without secured communities`, (done) => {
        let query = testUniqueId;
        chai.request(testUtils.BASE_URL)
            .get(`/searchCommunity/${query}`)
            .end((err, res) => {
                res.should.have.status(testUtils.STATUS_OK);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(1);
                res.body[0].type.should.be.eql('Private');
                res.body[0].communityName.should.be.eql('private' + testUniqueId);
                done()
            });
    });

    it(`it should POST deleteCommunity`, (done) => {
        chai.request(testUtils.BASE_URL)
            .post(`/deleteCommunity/`)
            .send({
                'communityId': communitiesDictionary['Public'],
            })
            .end((err, res) => {
                res.should.have.status(testUtils.STATUS_OK);
                res.body.should.be.eql(true);
                done()
            });
    });

});
