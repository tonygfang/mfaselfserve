# Express Sample Applications for Okta

This repository contains several sample applications that show you how to integrate various Okta use-cases into your Node.js application that uses the Express framework.

https://github.com/okta/samples-nodejs-express-4/

## Configuration

All of the samples share a single configuration file, [config.js](config.js). 
The config uses environment variables which can be either exported in the shell or stored in a file named `testenv` in this directory. 
See [dotenv](https://www.npmjs.com/package/dotenv) for more details on this file format. 
For Glitch, it's .env.

It may look something like:

```ini

# Okta config
OKTA_URL="https://yourOktaDomain.com.com"
API_KEY=abc123
AUTHORIZATION_SERVER=aus123456
CLIENT_ID=123
CLIENT_SECRET=abc123
SPA_CLIENT_ID=aaa

# Okta step up MFA app
STEPUP_CLIENT_ID=123
STEPUP_URL=https://yourOktaDomain.com/home/oidc_client/aaa/bbb

# Okta MFA Enroll Policy apps
SMS_CLIENT_ID=aaa
VOICE_CLIENT_ID=aaa
OV_CLIENT_ID=aaa
WEBAUTHN_CLIENT_ID=aaa
EMAIL_CLIENT_ID=aaa
QUESTION_CLIENT_ID=aaa
GOOGLE_CLIENT_ID=aaa


```

Please find the sample that fits your use-case from the table below.

| Sample                                  | Description                                                                                                                                                                   | Use-Case                                                      |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [Okta-Hosted Login](/okta-hosted-login) | An application server that uses the hosted login page on your Okta org, then creates a cookie session for the user in the Express application.                                | Traditional web applications with server-side rendered pages. |
| [Custom Login Page](/custom-login)      | An application server that uses the Okta Sign-In Widget on a custom login page within the application, then creates a cookie session for the user in the Express application. | Traditional web applications with server-side rendered pages. |
| [Resource Server](/resource-server)     | This is a sample API resource server that shows you how to authenticate requests with access tokens that have been issued by Okta.                                            | Single-Page applications.                                     |

## Okta-hosted login

In package.json, ensure it contains the following start:

```ini

  "scripts": {
    "start": "node okta-hosted-login/server.js"
  },


```

## Custom login

In package.json, ensure it contains the following start:

```ini

  "scripts": {
    "start": "node custom-login/server.js"
  },


```
