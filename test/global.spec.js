/* eslint-disable no-console */
// The hooks in this file are intended to be run before all other test files.
/* eslint-env and, mocha, chai */
/* eslint-disable no-unused-expressions */
/*  i had to add this to not error expect(res).to.be.json; statements  */
/* jshint esversion: 6 */
/* jshint -W030 */
/* jshint expr:true */

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

before((done) => {
  const testLocalPath = path.resolve(process.cwd(), '.env.test.local');
  const testPath = path.resolve(process.cwd(), '.env.test');

  let envPath;

  // Use .env.test.local for environmental variables if it exists (eg local development machine)
  if (fs.existsSync(testLocalPath)) {
    envPath = testLocalPath;
    // Otherwise use .env.test for environmental variables if it exists (eg Travis CI machine)
  } else if (fs.existsSync(testPath)) {
    envPath = testPath;
  }

  if (envPath) {
    // eslint-disable-next-line no-console
    console.log('Loading environmental variables', envPath);
    dotenv.load({
      path: envPath,
    });
    done();
  } else {
    done('Unable to find .env.test.local or .env.test');
  }
});
