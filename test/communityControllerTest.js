let mongoose = require("mongoose");
let Community = require('../models/Community');
let testUtils = require('./testUtils');

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();

chai.use(chaiHttp);

//Our parent block
describe(`Community Controller Tests`, () => {
    beforeEach((done) => {
        done();
    });

    it(`it should GET getCommunities by user key`, (done) => {
        chai.request(testUtils.BASE_URL)
            .get(`/getCommunities/${testUtils.USER_KEY}`)
            .end((err, res) => {
                res.should.have.status(testUtils.STATUS_OK);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(3);
                done()
            });
    });

    it(`it should GET searchCommunity by community name without secured communities`, (done) => {
        let query = 'test-community';
        chai.request(testUtils.BASE_URL)
            .get(`/searchCommunity/${query}`)
            .end((err, res) => {
                res.should.have.status(testUtils.STATUS_OK);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(2);
                res.body[0].type.should.be.not.eql('Secured');
                res.body[1].type.should.be.not.eql('Secured');
                done()
            });
    });

});
