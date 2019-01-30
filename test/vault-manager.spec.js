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

// eslint-disable-next-line prefer-destructuring
const expect = chai.expect;

chai.use(chaiHttp);

const pool = new pg.Pool();

describe('vault-manager', () => {
  beforeEach('wipe database to prepare testing.', async () => {
    try {
      await pool.query('DROP DATABASE IF EXISTS vault_3');
      await pool.query('DROP ROLE IF EXISTS vault_3_api');
      await pool.query('DROP ROLE IF EXISTS vault_3_adapter');
      await pool.query('DROP ROLE IF EXISTS vault_3_tally');
      await pool.query('DELETE FROM vault');
      await pool.query('TRUNCATE vault RESTART IDENTITY CASCADE');
      await pool.query('INSERT INTO vault (source_id, hostname, database_name, tally_role, tally_password, adapter_role, adapter_password, maintenance) VALUES (1, \'localhost\', \'vault_1\', \'vault_1_tally\', \'e18ab7ad6a9ab4e495dfaa046402501a\', \'vault_1_adapter\', \'0f7703c45d53866913cfcad139750c71\', FALSE)');
      await pool.query('INSERT INTO vault (source_id, hostname, database_name, tally_role, tally_password, adapter_role, adapter_password, maintenance) VALUES (2, \'localhost\', \'vault_2\', \'vault_2_tally\', \'e18ab7ad6a9ab4e495dfaa046402501b\', \'vault_2_adapter\', \'0f7703c45d53866913cfcad139750c72\', TRUE)');
    } catch (error) {
      console.log(error);
    }
  });

  describe('POST /vault/', () => {
    describe('Vault', () => {
      it('should successfully insert a record.', (done) => {
        chai.request(app)
          .post('/vault/')
          .set('content-type', 'application/json')
          .send({
            sourceId: 3,
          })
          .end((err, res) => {
            if (err) done(err);
            expect(res).to.have.status(201);
            expect(res.body.id).to.equal('3');

            chai.request(app)
              .get('/vault/3/connection/adapter')
              // eslint-disable-next-line no-shadow
              .end((err, res) => {
                if (err) done(err);
                expect(res).to.have.status(200);
                expect(res.body.hostname).to.equal('localhost');
                expect(res.body.database).to.equal('vault_3');
                expect(res.body.username).to.equal('vault_3_adapter');
                done();
              });
          });
      });

      it('should receive 409 if a record does exist.', (done) => {
        chai.request(app)
          .post('/vault/')
          .set('content-type', 'application/json')
          .send({
            sourceId: 1,
          })
          .end((err, res) => {
            if (err) done(err);
            expect(res).to.have.status(409);
            done();
          });
      });
    });
  });

  describe('GET /vault/{ sourceId }/connection/adapter', () => {
    it('should get an adapter successfully.', (done) => {
      chai.request(app)
        .get('/vault/1/connection/adapter')
        .end((err, res) => {
          if (err) done(err);
          expect(res).to.have.status(200);
          expect(res.body.hostname).to.equal('localhost');
          expect(res.body.database).to.equal('vault_1');
          expect(res.body.username).to.equal('vault_1_adapter');
          expect(res.body.password).to.equal('0f7703c45d53866913cfcad139750c71');
          done();
        });
    });

    it('should receive 404 if sourceId not found.', (done) => {
      chai.request(app)
        .get('/vault/3/connection/adapter')
        .end((err, res) => {
          if (err) done(err);
          expect(res).to.have.status(404);
          done();
        });
    });

    it('should receive 503 if a record with sourceId is marked with maintenance field as true.', (done) => {
      chai.request(app)
        .get('/vault/2/connection/adapter')
        .end((err, res) => {
          if (err) done(err);
          expect(res).to.have.status(503);
          done();
        });
    });
  });

  describe('GET /vault/{sourceId}/connection/tally', () => {
    it('should get a tally successfully.', (done) => {
      chai.request(app)
        .get('/vault/1/connection/tally')
        .end((err, res) => {
          if (err) done(err);
          expect(res).to.have.status(200);
          expect(res.body.hostname).to.equal('localhost');
          expect(res.body.database).to.equal('vault_1');
          expect(res.body.username).to.equal('vault_1_tally');
          expect(res.body.password).to.equal('e18ab7ad6a9ab4e495dfaa046402501a');
          done();
        });
    });

    it('should receive 404 if sourceId not found.', (done) => {
      chai.request(app)
        .get('/vault/3/connection/tally')
        .end((err, res) => {
          if (err) done(err);
          expect(res).to.have.status(404);
          done();
        });
    });

    it('should receive 503 if a record with sourceId is marked with maintenance field as true.', (done) => {
      chai.request(app)
        .get('/vault/2/connection/tally')
        .end((err, res) => {
          if (err) done(err);
          expect(res).to.have.status(503);
          done();
        });
    });
  });
});
