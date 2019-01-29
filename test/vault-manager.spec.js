/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-env and, mocha, chai */
/* eslint-disable no-unused-expressions */
/*  i had to add this to not error expect(res).to.be.json; statements  */
/* jshint esversion: 6 */
/* jshint -W030 */
/* jshint expr:true */

const chai = require('chai');
const chaiHttp = require('chai-http');
const pg = require('pg');

const app = require('../app');
const testData = require('./data');

// eslint-disable-next-line prefer-destructuring
const expect = chai.expect;

chai.use(chaiHttp);

const pool = new pg.Pool();

describe('vault-manager', () => {
  describe('POST /vault/', () => {
    before('Wipe database to prepare for testing.', (done) => {
      const wipeQuery = 'DELETE FROM vault;';
      pool.connect((connErr, client, release) => {
        if (connErr) {
          release();
          done(connErr);
        }
        client.query({
          text: wipeQuery,
        }, (err, res) => {
          release();
          pool.end();
          if (err) done(err);
          if (res) done();
        });
      });
    });

    describe('Vault', () => {
      it('should successfully insert a vault record', (done) => {
        chai.request(app)
          .post('/vault/')
          .set('content-type', 'application/json')
          .send(testData.vaultInsert)
          .end((err, res) => {
            if (err) done(err);
            expect(res).to.have.status(201);
            expect(res.body).to.haveOwnProperty('id');
            done();
          });
      });

      it('should get an adapter successfully', (done) => {
        chai.request(app)
          .get('/vault/1/connection/adapter')
          .end((err, res) => {
            if (err) done(err);
            expect(res).to.have.status(200);
            expect(res.body).to.haveOwnProperty('hostname');
            expect(res.body).to.haveOwnProperty('database');
            expect(res.body).to.haveOwnProperty('username');
            expect(res.body).to.haveOwnProperty('password');
            done();
          });
      });

      it('should get a tally successfully', (done) => {
        chai.request(app)
          .get('/database/1/connection/tally')
          .end((err, res) => {
            if (err) done(err);
            expect(res).to.have.status(200);
            expect(res.body).to.haveOwnProperty('hostname');
            expect(res.body).to.haveOwnProperty('database');
            expect(res.body).to.haveOwnProperty('username');
            expect(res.body).to.haveOwnProperty('password');
            done();
          });
      });
    });
  });
});
