/*
 * Copyright (c) 2018, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * A simple web server that initializes the OIDC Middleware library with the
 * given options, and attaches route handlers for the example profile page
 * and logout functionality.
 */

const express = require("express");
const session = require("express-session");
const mustacheExpress = require("mustache-express");
const path = require("path");
const { ExpressOIDC } = require("@okta/oidc-middleware");
const bodyParser = require("body-parser");

const templateDir = path.join(__dirname, "..", "common", "views");
const frontendDir = path.join(__dirname, "..", "common", "assets");

const auth = require("../auth");
const okta = require("@okta/okta-sdk-nodejs");

const factorutil = require("./factorutil");

// "atob" should be read as "ASCII to binary"
// atob converts Base64-encoded ASCII string to binary
const atob = (base64) => {
  return Buffer.from(base64, "base64").toString("binary");
};

module.exports = function SampleWebServer(
  sampleConfig,
  extraOidcOptions,
  homePageTemplateName
) {
  const oidc = new ExpressOIDC(
    Object.assign(
      {
        issuer: sampleConfig.oidc.issuer,
        client_id: sampleConfig.oidc.clientId,
        client_secret: sampleConfig.oidc.clientSecret,
        appBaseUrl: sampleConfig.oidc.appBaseUrl,
        scope: sampleConfig.oidc.scope,
        testing: sampleConfig.oidc.testing,
      },
      extraOidcOptions || {}
    )
  );

  const app = express();

  app.use(
    session({
      secret: "this-should-be-very-random",
      resave: true,
      saveUninitialized: false,
    })
  );

  // Provide the configuration to the view layer because we show it on the homepage
  const displayConfig = Object.assign({}, sampleConfig.oidc, {
    clientSecret:
      "****" +
      sampleConfig.oidc.clientSecret.substr(
        sampleConfig.oidc.clientSecret.length - 4,
        4
      ),
  });

  app.locals.oidcConfig = displayConfig;

  // This server uses mustache templates located in views/ and css assets in assets/
  app.use("/assets", express.static(frontendDir));
  app.engine("mustache", mustacheExpress());
  app.set("view engine", "mustache");
  app.set("views", templateDir);

  app.use(oidc.router);

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  app.get("/", (req, res) => {
    const template = homePageTemplateName || "home";
    const userinfo = req.userContext && req.userContext.userinfo;
    res.render(template, {
      isLoggedIn: !!userinfo,
      userinfo: userinfo,
    });
  });

  app.get("/verify-webauthn", (req, res) => {
    res.render("verify-webauthn");
  });

  app.get("/500", (req, res) => {
    res.status(500).json("500 error");
  });  
  
  app.get("/profile", oidc.ensureAuthenticated(), (req, res) => {
    // Convert the userinfo object into an attribute array, for rendering with mustache
    const userinfo = req.userContext && req.userContext.userinfo;
    const attributes = Object.entries(userinfo);
    res.render("profile", {
      isLoggedIn: !!userinfo,
      userinfo: userinfo,
      attributes,
    });
  });

  app.get("/mfa", oidc.ensureAuthenticated(), (req, res) => {
    // Convert the userinfo object into an attribute array, for rendering with mustache
    const userinfo = req.userContext && req.userContext.userinfo;

    console.log("mfa...");

    let factors = {};
    let webauthnFactors = { factors: [] };

    auth.client
      .getUser(userinfo.sub)
      .then((user) => {
        user
          .listSupportedFactors()
          .each((factor) => {
            if (
              factorutil.isSupportedFactor(factor.factorType, factor.provider)
            ) {
              let type = factorutil.getType(factor.factorType, factor.provider);

              // console.log(`found supported factor ${factor.factorType}`);
              if (factor.factorType == "webauthn") {
                webauthnFactors["factorType"] = factor.factorType;
                webauthnFactors["status"] = factor.status;
                // webauthnFactors["isActive"] = true;
                webauthnFactors["enableSetup"] = true; // todo: only true if < 5 authenticators
                webauthnFactors["name"] = factorutil.getName(
                  factor.factorType,
                  factor.provider
                );
                webauthnFactors["setupUrl"] = factorutil.getSetupLink(
                  factor.factorType,
                  factor.provider
                );
              } else {
                if (type === "ov" && factors[type]) {
                  console.log("found existing ov entry");
                  console.log(
                    `existing enableSetup: ${factors[type].enableSetup}`
                  );
                  console.log(`factor.status ${factor.status}`);

                  // OV setup should only be enabled if both totp and push are NOT_SETUP
                  if (
                    factor.status === "NOT_SETUP" &&
                    factors[type].status === "NOT_SETUP"
                  ) {
                    console.log("enable setup");
                    factors[type].enableSetup = true;
                  } else {
                    console.log("disable setup");
                    factors[type].enableSetup = false;
                  }
                } else {
                  factors[type] = {
                    factorType: type,
                    provider: factor.provider,
                    status: factor.status,
                    // isActive: factor.status === "ACTIVE",
                    enableSetup: factor.status === "NOT_SETUP",
                    name: factorutil.getName(
                      factor.factorType,
                      factor.provider
                    ),
                    setupUrl: factorutil.getSetupLink(
                      factor.factorType,
                      factor.provider
                    ),
                  };
                }
              }
            }
          })
          .then(() => {
            user
              .listFactors()
              .each((factor) => {
                if (
                  factorutil.isSupportedFactor(
                    factor.factorType,
                    factor.provider
                  ) &&
                  factor.status === "ACTIVE"
                ) {
                  let type = factorutil.getType(
                    factor.factorType,
                    factor.provider
                  );
                  // console.log(`found factor ${factor.factorType}`);
                  if (type == "webauthn") {
                    webauthnFactors["factors"].push({
                      factorid: factor.id,
                      name: factor.profile.authenticatorName,
                    });
                  } else {
                    if (
                      factors[type].factorid &&
                      type === "ov" &&
                      factor.factorType === "token:software:totp" &&
                      factor.provider === "OKTA"
                    ) {
                      let factoridOld = factors[type].factorid;
                      console.log(
                        `Don't overwrite existing factorid ${factoridOld} with ${factor.id}`
                      );
                    } else {
                      factors[type]["factorid"] = factor.id;
                    }
                  }
                }
              })
              .then(() => {
                console.log("factorArray: ");
                let factorArray = [];
                Object.keys(factors).forEach((key) =>
                  factorArray.push(factors[key])
                );
                console.log(factorArray);

                console.log("webauthnFactors: ");
                console.log(webauthnFactors);
                let multiFactorArray = [webauthnFactors];

                res.render("mfa", {
                  isLoggedIn: !!userinfo,
                  userinfo: userinfo,
                  href: "mfa",
                  factorArray,
                  multiFactorArray,
                });
              });
          });
      })
      .catch((err) => {
        console.error(err);
      });
  });

  app.get("/mfa2", oidc.ensureAuthenticated(), (req, res) => {
    // Convert the userinfo object into an attribute array, for rendering with mustache
    const userinfo = req.userContext && req.userContext.userinfo;

    console.log("mfa2...");

    let factors = {};
    let webauthnFactors = { factors: [] };

    auth.client
      .getUser(userinfo.sub)
      .then((user) => {
        user
          .listSupportedFactors()
          .each((factor) => {
            // if (factorutil.factorTypes.includes(factor.factorType)) {
            if (
              factorutil.isSupportedFactor(factor.factorType, factor.provider)
            ) {
              let type = factorutil.getType(factor.factorType, factor.provider);
              console.log(
                `Found supported factor ${type} ${factor.factorType} ${factor.provider}`
              );
              if (type == "webauthn") {
                webauthnFactors["factorType"] = factor.factorType;
                webauthnFactors["provider"] = factor.provider;
                webauthnFactors["status"] = factor.status;
                // webauthnFactors["isActive"] = true;
                webauthnFactors["enableSetup"] = true; // todo: what is the max number of authn factors allowed?
                webauthnFactors["name"] = factorutil.getName(
                  factor.factorType,
                  factor.provider
                );
                webauthnFactors["iconUrl"] = factorutil.getIconUrl(
                  factor.factorType,
                  factor.provider
                );
              } else {
                if (type === "ov" && factors[type]) {
                  console.log("found existing ov entry");
                  console.log(
                    `existing enableSetup: ${factors[type].enableSetup}`
                  );
                  console.log(`factor.status ${factor.status}`);

                  // OV setup should only be enabled if both totp and push are NOT_SETUP
                  if (
                    factor.status === "NOT_SETUP" &&
                    factors[type].status === "NOT_SETUP"
                  ) {
                    console.log("enable setup");
                    factors[type].enableSetup = true;
                  } else {
                    console.log("disable setup");
                    factors[type].enableSetup = false;
                  }
                } else {
                  factors[type] = {
                    factorType: type,
                    provider: factor.provider,
                    status: factor.status,
                    // isActive: factor.status === "ACTIVE",
                    enableSetup: factor.status === "NOT_SETUP",
                    name: factorutil.getName(
                      factor.factorType,
                      factor.provider
                    ),
                    iconUrl: factorutil.getIconUrl(
                      factor.factorType,
                      factor.provider
                    ),
                  };
                }
              }
            }
          })
          .then(() => {
            user
              .listFactors()
              .each((factor) => {
                if (
                  factorutil.isSupportedFactor(
                    factor.factorType,
                    factor.provider
                  ) &&
                  factor.status === "ACTIVE"
                ) {
                  let type = factorutil.getType(
                    factor.factorType,
                    factor.provider
                  );
                  console.log(
                    `Found factor ${type} ${factor.factorType} ${factor.provider}`
                  );

                  if (type == "webauthn") {
                    webauthnFactors["factors"].push({
                      factorid: factor.id,
                      name: factor.profile.authenticatorName,
                    });
                  } else {
                    if (
                      factors[type].factorid &&
                      type === "ov" &&
                      factor.factorType === "token:software:totp" &&
                      factor.provider === "OKTA"
                    ) {
                      let factoridOld = factors[type].factorid;
                      console.log(
                        `Don't overwrite existing factorid ${factoridOld} with ${factor.id}`
                      );
                    } else {
                      factors[type]["factorid"] = factor.id;
                    }
                  }
                }
              })
              .then(() => {
                console.log("factors: ");
                console.log(factors);

                let factorArray = [];
                Object.keys(factors).forEach((key) =>
                  factorArray.push(factors[key])
                );
                // console.log("factorArray: ");
                // console.log(factorArray);

                // console.log("webauthnFactors: ");
                // console.log(webauthnFactors);
                let multiFactorArray = [];

                if (
                  webauthnFactors.status === "ACTIVE" ||
                  webauthnFactors.status === "NOT_SETUP"
                ) {
                  multiFactorArray.push(webauthnFactors);
                }

                let questions = factorutil.questions;

                res.render("mfa2", {
                  isLoggedIn: !!userinfo,
                  userinfo: userinfo,
                  factorArray,
                  multiFactorArray,
                  questions,
                });
              });
          });
      })
      .catch((err) => {
        console.error(err);
      });
  });

  app.get("/stepup-iframe", oidc.ensureAuthenticated(), (req, res) => {
    // Convert the userinfo object into an attribute array, for rendering with mustache
    const userinfo = req.userContext && req.userContext.userinfo;
    const attributes = Object.entries(userinfo);

    let stepupUrl = process.env.STEPUP_URL;
    console.log(stepupUrl);

    res.render("stepup-iframe", {
      isLoggedIn: !!userinfo,
      userinfo: userinfo,
      attributes,
      stepupUrl: stepupUrl,
    });
  });

  app.post("/stepup-callback", (req, res) => {
    // Convert the userinfo object into an attribute array, for rendering with mustache
    // const userinfo = req.userContext && req.userContext.userinfo;
    // const attributes = Object.entries(userinfo);

    console.log("post stepup-callback");
    // console.log(req.body);

    // extract id_token from body

    let idTokenStr = req.body.id_token;
    let idToken = JSON.parse(atob(idTokenStr.split(".")[1]));
    console.log(idToken);

    // todo: make an introspect call to check status of id token, add that to stepup-callback

    res.render("stepup-callback", { active: true });
  });

  app.get("/stepup-api", oidc.ensureAuthenticated(), (req, res) => {
    // Convert the userinfo object into an attribute array, for rendering with mustache
    const userinfo = req.userContext && req.userContext.userinfo;
    const attributes = Object.entries(userinfo);

    res.render("stepup-api", {
      isLoggedIn: !!userinfo,
      userinfo: userinfo,
      attributes,
    });
  });

  app.get("/test", oidc.ensureAuthenticated(), (req, res) => {
    // Convert the userinfo object into an attribute array, for rendering with mustache
    const userinfo = req.userContext && req.userContext.userinfo;
    const attributes = Object.entries(userinfo);
    let questions = factorutil.questions;

    res.render("test", {
      isLoggedIn: !!userinfo,
      userinfo: userinfo,
      attributes,
      questions,
    });
  });

  app.post(
    "/api/deleteFactor/:factorid",
    oidc.ensureAuthenticated(),
    (req, res) => {
      const userinfo = req.userContext && req.userContext.userinfo;

      console.log("post deleteFactor");

      let factorid = req.params.factorid;
      console.log(factorid);

      auth.client
        .deleteFactor(userinfo.sub, factorid)
        .then(() => {
          console.log("success deleted " + factorid);
          return res.send("deleted");
        })
        .catch((err) => {
          console.error(err);
        });
    }
  );

  app.post(
    "/api/enrollFactor",
    oidc.ensureAuthenticated(),
    (req, res, next) => {
      const userinfo = req.userContext && req.userContext.userinfo;

      console.log("post enrollFactor");

      // console.log(req.query);
      console.log(req.body);

      auth.client
        .enrollFactor(userinfo.sub, req.body)
        .then((factor) => {
          console.log("enrollFactor success");
          // console.log(factor);
          console.log(`${factor.id} ${factor.factorType} ${factor.status} `);
          return res.send(factor);
        })
        .catch((err) => {
          console.error("enrollFactor err");
          return res.status(err.status).send(factorutil.getErrorMessage(err));
        });
    }
  );

  app.post(
    "/api/resendFactor/:factorid",
    oidc.ensureAuthenticated(),
    (req, res) => {
      const userinfo = req.userContext && req.userContext.userinfo;

      console.log("post resendFactor");
      console.log(req.body);

      const url = `${process.env.OKTA_URL}/api/v1/users/${userinfo.sub}/factors/${req.params.factorid}/resend`;
      console.log(url);

      const request = {
        method: "post",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      };

      auth.client.http
        .http(url, request)
        .then((result) => result.text())
        .then((result) => JSON.parse(result))
        .then((result) => {
          console.log("resend success");
          console.log(result);

          return res.status(200).send(result);
        })
        .catch((err) => {
          console.error("resendFactor err");
          return res.status(err.status).send(factorutil.getErrorMessage(err));
        });
    }
  );

  app.post(
    "/api/activateFactor/:factorid",
    oidc.ensureAuthenticated(),
    (req, res) => {
      const userinfo = req.userContext && req.userContext.userinfo;

      console.log("post activateFactor");
      console.log(req.body);

      auth.client
        .activateFactor(userinfo.sub, req.params.factorid, req.body)
        .then((factor) => {
          console.log("activateFactor success");
          console.log(factor);
          return res.send(factor);
        })
        .catch((err) => {
          return res.status(err.status).send(factorutil.getErrorMessage(err));
        });
    }
  );

  app.post(
    "/api/verifyFactor/:factorid",
    oidc.ensureAuthenticated(),
    (req, res) => {
      const userinfo = req.userContext && req.userContext.userinfo;

      console.log("post verifyFactor");
      console.log(req.body);

      let query = req.query ? req.query : {};
      console.log(query);

      auth.client
        .verifyFactor(userinfo.sub, req.params.factorid, req.body, query)
        .then((factor) => {
          console.log("verifyFactor success");
          console.log(factor);
          return res.send(factor);
        })
        .catch((err) => {
          return res.status(err.status).send(factorutil.getErrorMessage(err));
        });
    }
  );

  app.post(
    "/api/pollFactor/:factorid",
    oidc.ensureAuthenticated(),
    (req, res) => {
      const userinfo = req.userContext && req.userContext.userinfo;

      console.log("post pollFactor");

      const url = `${process.env.OKTA_URL}/api/v1/users/${userinfo.sub}/factors/${req.params.factorid}/lifecycle/activate/poll`;
      console.log(url);

      const request = {
        method: "post",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      };

      auth.client.http
        .http(url, request)
        .then((result) => result.text())
        .then((result) => JSON.parse(result))
        .then((factor) => {
          console.log("pollFactor success");
          console.log(factor);
          console.log(`status: ${factor.status}`);
          console.log(`expiresAt: ${factor.expiresAt}`);
          console.log(`factorResult: ${factor.factorResult}`);

          return res.status(200).send(factor);
        })
        .catch((err) => {
          console.error("pollFactor err");
          return res.status(err.status).send(factorutil.getErrorMessage(err));
        });
    }
  );

  app.post(
    "/api/sendPushFactorActivation/:factorid/:option",
    oidc.ensureAuthenticated(),
    (req, res) => {
      const userinfo = req.userContext && req.userContext.userinfo;

      console.log("post sendPushFactorActivation");
      console.log(req.params.option);

      console.log(req.body);
      let body = req.body ? req.body : {};
      console.log(body);

      const url = `${process.env.OKTA_URL}/api/v1/users/${userinfo.sub}/factors/${req.params.factorid}/lifecycle/activate/${req.params.option}`;
      console.log(url);

      const request = {
        method: "post",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      };
      console.log(request);

      auth.client.http
        .http(url, request)
        .then((result) => result.text())
        .then((result) => JSON.parse(result))
        .then((factor) => {
          console.log("sendPushFactorActivation success");
          console.log(factor);
          console.log(`status: ${factor.status}`);

          return res.status(200).send(factor);
        })
        .catch((err) => {
          console.error("sendPushFactorActivation err");
          return res.status(err.status).send(factorutil.getErrorMessage(err));
        });
    }
  );

  app.get("/api/listActiveFactors", oidc.ensureAuthenticated(), (req, res) => {
    console.log("get listActiveFactors");
    const userinfo = req.userContext && req.userContext.userinfo;

    let factors = [];

    auth.client
      .getUser(userinfo.sub)
      .then((user) => {
        user
          .listFactors()
          .each((factor) => {
            if (factorutil.isSupportedFactor(factor.factorType, factor.provider) && factor.status === "ACTIVE") {
              let type = factorutil.getType(factor.factorType, factor.provider);
              console.log(`Found active factor: ${factor.factorType} ${factor.provider}`);
              factors.push(factor);
            }
          })
          .then(() => {
            console.log("factors: ");
            console.log(factors);
          
            return res.status(200).send(factors);
          });
      })
      .catch((err) => {
        console.error(err);
        return res.status(err.status).send(factorutil.getErrorMessage(err));
      });
  });

  app.get(
    "/api/factorTransactionStatus/:factorid/:transactionid",
    oidc.ensureAuthenticated(),
    (req, res) => {
      const userinfo = req.userContext && req.userContext.userinfo;

      console.log("get factorTransactionStatus");

      auth.client
        .getFactorTransactionStatus(userinfo.sub, req.params.factorid, req.params.transactionid)
        .then((factorResult) => {
          console.log("getFactorTransactionStatus success");
          console.log(factorResult);
          return res.send(factorResult);
        })
        .catch((err) => {
          return res.status(err.status).send(factorutil.getErrorMessage(err));
        });
    }
  );
  
  oidc.on("ready", () => {
    // eslint-disable-next-line no-console
    app.listen(sampleConfig.port, () =>
      console.log(`App started on port ${sampleConfig.port}`)
    );
  });

  oidc.on("error", (err) => {
    // An error occurred with OIDC
    // eslint-disable-next-line no-console
    console.error("OIDC ERROR: ", err);

    // Throwing an error will terminate the server process
    // throw err;
  });
};
