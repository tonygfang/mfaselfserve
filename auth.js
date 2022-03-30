const okta = require("@okta/okta-sdk-nodejs");


const client = new okta.Client({
  orgUrl: process.env.OKTA_URL,
  token: process.env.API_KEY
});


module.exports = { client };