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
      const wipeQuery = `DELETE FROM vault;
      INSERT INTO vault (sourceid, hostname, databasename, tallyrole, tallypassword, adapterrole, adapterpassword, maintenance) VALUES (2, 'localhost', 'vault_34', 'vault_34_tally', 'e18ab7ad6a9ab4e495dfaa046402501a', 'vault_34_adapter', '0f7703c45d53866913cfcad139750c71', TRUE);
      `;
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
    });
  });

  describe('GET /vault/{ sourceId }/connection/adapter', () => {
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

    it('should receive 404', (done) => {
      chai.request(app)
        .get('/vault/3/connection/adapter')
        .end((err, res) => {
          if (err) done(err);
          expect(res).to.have.status(404);
          done();
        });
    });

    it('should receive 503', (done) => {
      chai.request(app)
        .get('/vault/2/connection/adapter')
        .end((err, res) => {
          if (err) done(err);
          expect(res).to.have.status(503);
          done();
        });
    });
  });

  describe('GET /database/{sourceId}/connection/tally', () => {
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

    it('should receive 404', (done) => {
      chai.request(app)
        .get('/database/3/connection/tally')
        .end((err, res) => {
          if (err) done(err);
          expect(res).to.have.status(404);
          done();
        });
    });

    it('should receive 503', (done) => {
      chai.request(app)
        .get('/database/2/connection/tally')
        .end((err, res) => {
          if (err) done(err);
          expect(res).to.have.status(503);
          done();
        });
    });
  });
});
