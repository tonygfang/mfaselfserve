/* eslint-disable consistent-return, no-console */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Users can also provide the testenv configuration at the root folder
require('dotenv').config({ path: path.join(__dirname, '..', 'testenv') });

function validateConfig() {
  if (!process.env.OKTA_URL || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.AUTHORIZATION_SERVER || !process.env.API_KEY) {
    console.log('[ERROR] Please set the necessary Environment variables (OKTA_URL, CLIENT_ID, CLIENT_SECRET, AUTHORIZATION_SERVER, API_KEY)');
    process.exit(1);
  }
}

function cloneRepository(repository, directory) {
  const dir = path.join(__dirname, '..', directory);
  if (fs.existsSync(dir)) {
    console.log(`${directory} is already cloned. Getting latest version...`);
    execSync(`cd ${directory} && git pull`)
    return;
  }

  const command = `git clone ${repository}`;
  console.log(`Cloning repository ${directory}`);
  execSync(command);
}

validateConfig();
cloneRepository('https://github.com/okta/okta-oidc-tck.git', 'okta-oidc-tck');
