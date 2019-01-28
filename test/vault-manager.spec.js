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

// const app = require('../bin/www');
// const testData = require('./data');

// const expect = chai.expect;

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

    it('test', () => {});
  });
});
