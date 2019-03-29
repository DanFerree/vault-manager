/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-env and, mocha, chai */
/* eslint-disable no-unused-expressions */
/*  i had to add this to not error expect(res).to.be.json; statements  */
/* jshint esversion: 8 */
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
  before('wipe database to prepare testing.', async () => {
    await pool.query('DROP DATABASE IF EXISTS vault_3');
    await pool.query('DROP ROLE IF EXISTS vault_3_api');
    await pool.query('DROP ROLE IF EXISTS vault_3_adapter');
    await pool.query('DROP ROLE IF EXISTS vault_3_tally');
    await pool.query('TRUNCATE vault RESTART IDENTITY CASCADE');
    await pool.query('INSERT INTO vault (source_id, hostname, port, database_name, tally_role, tally_password, tally_cert, adapter_role, adapter_password, maintenance) VALUES (1, \'localhost\', 5432, \'vault_1\', \'vault_1_tally\', \'e18ab7ad6a9ab4e495dfaa046402501a\', \'Base64_x509_cert\', \'vault_1_adapter\', \'0f7703c45d53866913cfcad139750c71\', FALSE)');
    await pool.query('INSERT INTO vault (source_id, hostname, port, database_name, tally_role, tally_password, tally_cert, adapter_role, adapter_password, maintenance) VALUES (2, \'localhost\', 5432, \'vault_2\', \'vault_2_tally\', \'e18ab7ad6a9ab4e495dfaa046402501b\', \'\', \'vault_2_adapter\', \'0f7703c45d53866913cfcad139750c72\', TRUE)');
    await pool.end();
  });
  describe('POST /vault/', () => {
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
            .end((err2, res2) => {
              if (err2) done(err2);
              expect(res2).to.have.status(200);
              expect(res2.body.hostname).to.equal('localhost');
              expect(res2.body.port).to.equal(5432);
              expect(res2.body.database).to.equal('vault_3');
              expect(res2.body.username).to.equal('vault_3_adapter');
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

  describe('GET /vault/{sourceId}/connection/adapter', () => {
    it('should get an adapter successfully.', (done) => {
      chai.request(app)
        .get('/vault/1/connection/adapter')
        .end((err, res) => {
          if (err) done(err);
          expect(res).to.have.status(200);
          expect(res.body.hostname).to.equal('localhost');
          expect(res.body.port).to.equal(5432);
          expect(res.body.database).to.equal('vault_1');
          expect(res.body.username).to.equal('vault_1_adapter');
          expect(res.body.password).to.equal('0f7703c45d53866913cfcad139750c71');
          done();
        });
    });

    it('should receive 404 if sourceId not found.', (done) => {
      chai.request(app)
        .get('/vault/4/connection/adapter')
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
          expect(res.body.port).to.equal(5432);
          expect(res.body.database).to.equal('vault_1');
          expect(res.body.username).to.equal('vault_1_tally');
          expect(res.body.cert).to.equal('Base64_x509_cert');
          expect(res.body.password).to.equal('e18ab7ad6a9ab4e495dfaa046402501a');
          done();
        });
    });

    it('should receive 404 if sourceId not found.', (done) => {
      chai.request(app)
        .get('/vault/4/connection/tally')
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

  describe('GET /vault/?missingTally=true', () => {
    it('should get all records (3).', (done) => {
      chai.request(app)
        .get('/vault/')
        .end((err, res) => {
          if (err) done(err);
          expect(res).to.have.status(200);
          expect(Array.isArray(res.body)).to.be.true;
          expect(res.body).to.have.lengthOf(3);
          done();
        });
    });

    it('should get only records that have no tally_cert (2).', (done) => {
      chai.request(app)
        .get('/vault/?missingTally=true')
        .end((err, res) => {
          if (err) done(err);
          expect(res).to.have.status(200);
          expect(Array.isArray(res.body)).to.be.true;
          expect(res.body).to.have.lengthOf(2);
          expect(res.body[0].tally_cert).to.be.empty;
          done();
        });
    });
  });

  describe('POST /vault/:sourceId/', () => {
    it('should successfully update a record.', (done) => {
      chai.request(app)
        .post('/vault/3/')
        .set('content-type', 'application/json')
        .send({
          tally_cert: 'Base64 encoded X509 certificate...',
        })
        .end((err, res) => {
          if (err) done(err);
          expect(res).to.have.status(200);
          chai.request(app)
            .get('/vault/3/connection/tally')
            .end((err2, res2) => {
              if (err2) done(err2);
              expect(res2).to.have.status(200);
              expect(res2.body.cert).to.equal('Base64 encoded X509 certificate...');
              done();
            });
        });
    });

    it('should receive 400 if a input is invalid.', (done) => {
      chai.request(app)
        .post('/vault/2/')
        .set('content-type', 'application/json')
        .send({
          no_tally_cert: 'This should not work...',
        })
        .end((err, res) => {
          if (err) done(err);
          expect(res).to.have.status(400);
          done();
        });
    });

    it('should receive 404 if a record not found.', (done) => {
      chai.request(app)
        .post('/vault/7/')
        .set('content-type', 'application/json')
        .send({
          tally_cert: 'This should not work...',
        })
        .end((err, res) => {
          if (err) done(err);
          expect(res).to.have.status(404);
          done();
        });
    });
  });
});
