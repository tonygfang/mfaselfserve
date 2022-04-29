$(document).ready(function () {
  console.log("ready");

  // initialize semantic dropdowns
  // $(".ui.dropdown").dropdown();

  $("#from_account").dropdown();
  $("#to_account").dropdown();
  
  $("#from_account").dropdown("set selected", "800000");
  $("#to_account").dropdown("set selected", "800001");

  $("#transfer_success_msg").hide();
  $("#transfer_error_msg").hide();

  initializeStepup();
});


const messageDelay = 10000;
const resendDelayEmail = 10000;
const resendDelaySMS = 10000;
const resendDelayCall = 10000;
const pollDelayPush = 10000;

var stepupTimeout;
var listedFactors;
var verifyResponse;

function showError(err) {
  console.log("showError");

  console.error(err);
  console.error(err.responseText);

  let errmsg = err;
  if (err.responseText) {
    errmsg = err.responseText;
  }

  $("#error_msg_stepup").text(errmsg);
  $("#error_msg_stepup").show();
}

function onFactorDropdownChange(value, text) {
  console.log("onFactorDropdownChange");
  console.log(value);

  if (!value) {
    return;
  }

  hideStepupMessages();

  console.log('Clear timeouts');
  clearTimeout(stepupTimeout);
  
  // set image
  // defined in factorutil.js
  // let icon = getIcon(value);
  // $("#img_factor_stepup").attr("src", icon);
  $("#img_factor_stepup").attr("src", getLogo(value));
  // let factorName = getName(value);
  $("#name_factor_stepup").text(getName(value));

  // show factor ui
  switch (value) {
    case "question":
      showQuestionStepup();
      break;
    case "sms":
      showSMSStepup();
      break;
    case "call":
      showCallStepup();
      break;
    case "email":
      showEmailStepup();
      break;
    case "ov":
      showOVStepup();
      break;
    case "google":
      showGoogleStepup();
      break;
    case "webauthn":
      showWebauthnStepup();
      break;
  }
}

function getDropdownItem(factor) {
  console.log("getDropdownItem");

  let item = `<div class="item" data-value="${factor.type}">`;
  item += `<img class="ui avatar image" src="${factor.icon}" />`;
  item += `${factor.name}`;
  item += `</div>`;
  
  return item;
}

function initializeFactorDropdown() {
  console.log("initializeFactorDropdown");

  let factors = getFactorsByType(listedFactors);
  $("#factor_dropdown .menu").empty();
  
  factors
    .forEach((o) => {
      let item = getDropdownItem(o);
      console.log(item);
      $("#factor_dropdown .menu").append(item);
    });

  // let config = {
  //   onChange: onFactorDropdownChange,
  // };

  $("#factor_dropdown").dropdown('refresh');
  $("#factor_dropdown").dropdown('set selected', factors[0].type)
}

function initializeStepup() {
  console.log("initializeStepup");

  verifyResponse = {};
  listedFactors = {};
  
  let config = {
    onChange: onFactorDropdownChange,
  };

  $("#factor_dropdown").dropdown(config);
  
  hideStepupMessages();

  hideAllStepup();
}

// todo: add parameter for factor assurance level
function showStepUp(functioncall) {
  console.log("showStepUp");
  console.log(functioncall);

  initializeStepup();

  // call listFactors
  // initialize modal with factors list

  $.ajax({
    url: "/api/listActiveFactors",
    method: "GET",
  })
    .done(function (factors) {
      console.log("success listActiveFactors");
      console.log(factors);

      // store factors in global
      // todo: filter out factors based on assurance level
      listedFactors = factors;
    
      // init factors list into dropdown for
      initializeFactorDropdown();

      $("#popup-stepup-api")
        .modal({
          onDeny: functioncall,
          onApprove: functioncall,
          onHide: functioncall,
        })
        .modal("show");
    })
    .fail(function (err, textStatus) {
      showError(err);
    });
}

function hideAllStepup() {
  console.log("hideAllStepup");

  $("#question_stepup").hide();
  $("#sms_stepup").hide();
  $("#call_stepup").hide();
  $("#email_stepup").hide();
  $("#ov_stepup").hide();
  $("#google_stepup").hide();
  $("#webauthn_stepup").hide();
}

function hideMessages() {
  console.log("hideMessages");

  $("#transfer_success_msg").fadeOut();
  $("#transfer_error_msg").fadeOut();
}

function hideStepupMessages() {
  $("#error_msg_stepup").hide();
  $("#warning_msg_stepup").hide();
}

function mfaValidated(response) {
  console.log("mfaValidated");

  hideStepupMessages();
  
  verifyResponse = response;
  $("#popup-stepup-api").modal("hide");
}

// Security Question

function showQuestionStepup() {
  console.log("showQuestionStepup");

  hideAllStepup();
  $("#question_answer").text("");
  $("#question_stepup").fadeIn("slow");

  let factor = listedFactors.find((o) => o.factorType === "question");

  console.log(factor.id);
  console.log(factor.profile.question);
  console.log(factor.profile.questionText);

  $("#question_text").text(factor.profile.questionText);
}

function verifyQuestion() {
  console.log("verifyQuestion");

  let factor = listedFactors.find((o) => o.factorType === "question");

  console.log(factor.id);
  console.log(factor.profile.question);
  console.log(factor.profile.questionText);

  let answer = $("#question_answer").val();
  console.log(answer);

  if (!answer) {
    let message = "Answer cannot be blank";
    $("#error_msg_stepup").text(message);
    $("#error_msg_stepup").show();
    return;
  }

  let body = {
    answer: answer,
  };

  $.ajax({
    url: `/api/verifyFactor/${factor.id}`,
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("verify success!");
      console.log(response);

      $("#error_msg_stepup").fadeOut("slow");

      mfaValidated(response);
    })
    .fail(function (err, textStatus) {
      showError(err);
    });
}

// SMS

function showSMSStepup() {
  console.log("showSMSStepup");

  hideAllStepup();
  $("#code_sms").text("");

  $("#sms_stepup").fadeIn("slow");

  let factor = listedFactors.find((o) => o.factorType === "sms");

  console.log(factor.id);
  console.log(factor.profile.phoneNumber);

  $("#sms_phone").text(maskPhone(factor.profile.phoneNumber));
}

function disableSendSMSButton() {
  console.log("disableSendSMSButton");

  // update text to Sent
  $("#send_sms").prop("value", "Sent");

  // grey out send button
  $("#send_sms").prop("disabled", true);
}

function showResendSMSButton() {
  console.log("showResendSMSButton");

  // show resend warning message
  $("#warning_msg_stepup").text(
    "Haven't received an SMS? To try again, click Re-send code."
  );
  $("#warning_msg_stepup").show();

  // rename Send button to Resend
  $("#send_sms").prop("value", "Resend code");

  // enable button
  $("#send_sms").prop("disabled", false);
}

function challengeSMS() {
  console.log("challengeSMS");

  let factor = listedFactors.find((o) => o.factorType === "sms");
  console.log(factor.id);

  disableSendSMSButton();

  $.ajax({
    url: `/api/verifyFactor/${factor.id}`,
    method: "POST",
  })
    .done(function (response) {
      console.log("challengeSMS success!");
      console.log(response);

      $("#error_msg_stepup").fadeOut("slow");

      // show resend sms message following delay
      stepupTimeout = setTimeout("showResendSMSButton()", resendDelaySMS);
    })
    .fail(function (err, textStatus) {
      showError(err);
    });
}

function verifySMS() {
  console.log("verifySMS");

  let factor = listedFactors.find((o) => o.factorType === "sms");
  console.log(factor.id);

  let code = $("#code_sms").val();
  console.log(code);

  if (!code) {
    let message = "Verification code cannot be blank";
    $("#error_msg_stepup").text(message);
    $("#error_msg_stepup").show();
    return;
  }

  let body = {
    passCode: code,
  };

  $.ajax({
    url: `/api/verifyFactor/${factor.id}`,
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("verify success!");
      console.log(response);

      mfaValidated(response);
    })
    .fail(function (err, textStatus) {
      showError(err);
    });
}

// Voice Call

function showCallStepup() {
  console.log("showCallStepup");

  hideAllStepup();
  $("#code_call").text("");

  $("#call_stepup").fadeIn("slow");
  $("#call_verify_ui").hide();

  let factor = listedFactors.find((o) => o.factorType === "call");

  console.log(factor.id);
  console.log(factor.profile.phoneNumber);

  $("#call_phone").text(maskPhone(factor.profile.phoneNumber));
}

function disableCallButton() {
  console.log("disableCallButton");

  // update text
  $("#send_call").prop("value", "Called");

  // grey out button
  $("#send_call").prop("disabled", true);
}

function showCallAgainButton() {
  console.log("showCallAgainButton");

  // show resend warning message
  $("#warning_msg_stepup").text(
    "Haven't received an SMS? To try again, click Re-send code."
  );
  $("#warning_msg_stepup").show();

  // rename Send button to Resend
  $("#send_call").prop("value", "Call again");

  // enable button
  $("#send_call").prop("disabled", false);
}

function challengeCall() {
  console.log("challengeCall");

  let factor = listedFactors.find((o) => o.factorType === "call");
  console.log(factor.id);

  disableCallButton();

  $.ajax({
    url: `/api/verifyFactor/${factor.id}`,
    method: "POST",
  })
    .done(function (response) {
      console.log("challengeCall success!");
      console.log(response);

      $("#error_msg_stepup").fadeOut("slow");

      // show call again message following delay
      stepupTimeout = setTimeout("showCallAgainButton()", resendDelayCall);
    })
    .fail(function (err, textStatus) {
      showError(err);
    });
}

function verifyCall() {
  console.log("verifyCall");

  let factor = listedFactors.find((o) => o.factorType === "call");
  console.log(factor.id);

  let code = $("#code_call").val();
  console.log(code);

  if (!code) {
    let message = "Verification code cannot be blank";
    $("#error_msg_stepup").text(message);
    $("#error_msg_stepup").show();
    return;
  }

  let body = {
    passCode: code,
  };

  $.ajax({
    url: `/api/verifyFactor/${factor.id}`,
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("verify success!");
      console.log(response);

      mfaValidated(response);
    })
    .fail(function (err, textStatus) {
      showError(err);
    });
}

// Email
function showEmailStepup() {
  console.log("showEmailStepup");

  hideAllStepup();
  $("#code_email").text("");

  $("#email_stepup").fadeIn("slow");

  $("#email_verify_ui").hide();

  let factor = listedFactors.find((o) => o.factorType === "email");

  console.log(factor.id);
  console.log(factor.profile.email);

  let email = maskEmail(factor.profile.email);

  let email_instructions = `Send a verification code to ${email}`;
  $("#email_instructions").text(email_instructions);
}

function showResendEmailWarning() {
  let message = `Haven't received an email? <a href='javascript:null' onClick='javascript:challengeEmail();'>Send again</a>`;
  $("#warning_msg_stepup").html(message);
  $("#warning_msg_stepup").fadeIn("slow");
}

function showVerifyEmail(email) {
  console.log("showVerifyEmail");

  $("#send_email").hide();

  let email_instructions = `A verification code was sent to ${email}. Check your email and enter the code below.`;
  $("#email_instructions").text(email_instructions);

  $("#email_verify_ui").fadeIn("slow");
}

function challengeEmail() {
  console.log("challengeEmail");

  let factor = listedFactors.find((o) => o.factorType === "email");
  console.log(factor.id);
  let maskedEmail = maskEmail(factor.profile.email);

  $("#warning_msg_stepup").hide();
  $("#send_email").prop("disabled", true);

  $.ajax({
    url: `/api/verifyFactor/${factor.id}`,
    method: "POST",
  })
    .done(function (response) {
      console.log("challengeSMS success!");
      console.log(response);

      $("#error_msg_stepup").fadeOut("slow");

      showVerifyEmail(maskedEmail);

      // show resend email message following delay
      stepupTimeout = setTimeout("showResendEmailWarning()", resendDelayEmail);
    })
    .fail(function (err, textStatus) {
      showError(err);
    });
}

function verifyEmail() {
  console.log("verifyEmail");

  let factor = listedFactors.find((o) => o.factorType === "email");
  console.log(factor.id);

  let code = $("#code_email").val();
  console.log(code);

  if (!code) {
    let message = "Verification code cannot be blank";
    $("#error_msg_stepup").text(message);
    $("#error_msg_stepup").show();
    return;
  }

  let body = {
    passCode: code,
  };

  $.ajax({
    url: `/api/verifyFactor/${factor.id}`,
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("verify success!");
      console.log(response);

      mfaValidated(response);
    })
    .fail(function (err, textStatus) {
      showError(err);
    });
}

// Okta Verify

function showOVStepup() {
  console.log("showOVStepup");

  hideAllStepup();

  $("#ov_code").text("");

  let factorOVTotp = listedFactors.find(
    (o) => o.factorType === "token:software:totp" && o.provider === "OKTA"
  );

  let factorOVPush = listedFactors.find(
    (o) => o.factorType === "push" && o.provider === "OKTA"
  );

  if (factorOVPush && factorOVPush.status == "ACTIVE") {
    console.log(factorOVPush.id);
    console.log(factorOVPush.profile.name);

    $("#name_factor_stepup").text(
      `${getName("ov")} (${factorOVPush.profile.name})`
    );

    $("#ov_push").show();
    $("#ov_enter_code_link").show();
    $("#ov_code_message").hide();
    $("#ov_enter_code").hide();
  } else {
    console.log(factorOVTotp.id);

    $("#ov_push").hide();
    $("#ov_code_message").show();
    $("#ov_code").show();
  }

  $("#ov_stepup").fadeIn("slow");
}

function enableSendPush() {
  console.log("enableSendPush");

  $("#send_ov_push").prop("value", "Send push");
  $("#send_ov_push").prop("disabled", false);
}

function disableSendPush() {
  console.log("disableSendPush");

  $("#send_ov_push").prop("value", "Push sent!");
  $("#send_ov_push").prop("disabled", true);
}

function challengeOVPush() {
  console.log("challengeOVPush");

  let factor = listedFactors.find(
    (o) => o.factorType === "push" && o.provider === "OKTA"
  );
  console.log(factor.id);

  $("#warning_msg_stepup").hide();
  disableSendPush();

  $.ajax({
    url: `/api/verifyFactor/${factor.id}`,
    method: "POST",
  })
    .done(function (response) {
      console.log("challengeOVPush success!");
      console.log(response);
      console.log(response.factorResult);
      let pollLink = response._links.poll.href;
      console.log(pollLink);

      let transactionid = pollLink.substring(pollLink.lastIndexOf("/") + 1);
      console.log(transactionid);

      $("#error_msg_stepup").fadeOut("slow");

      // start polling
      stepupTimeout = setTimeout(pollOVPush(factor.id, transactionid), pollDelayPush);
    })
    .fail(function (err, textStatus) {
      showError(err);
    });
}

function pollOVPush(factorid, transactionid) {
  console.log("pollOVPush");

  console.log(factorid);
  console.log(transactionid);

  $.ajax({
    url: `/api/factorTransactionStatus/${factorid}/${transactionid}`,
    method: "GET",
  })
    .done(function (response) {
      console.log("pollFactor success!");
      console.log(response);
      console.log(`factorResult: ${response.factorResult}`);

      switch (response.factorResult) {
        case "WAITING":
          console.log("waiting, set the timeout again");
          stepupTimeout = setTimeout(pollOVPush(factorid, transactionid), pollDelayPush);
          break;

        case "SUCCESS":
          console.log("success!");
          mfaValidated(response);
          break;

        case "REJECTED":
        case "TIMEOUT":
          $("#error_msg_stepup").text(`Push request ${response.factorResult}`);
          $("#error_msg_stepup").show();

          enableSendPush();
          break;
      }
    })
    .fail(function (err, textStatus) {
      showError(err);
    });
}

function showOVCode() {
  console.log("showOVCode");

  $("#ov_enter_code_link").hide();
  $("#ov_enter_code").fadeIn("slow");
}

function verifyOVCode() {
  console.log("verifyOVCode");

  let factor = listedFactors.find(
    (o) => o.factorType === "token:software:totp" && o.provider === "OKTA"
  );
  console.log(factor.id);

  let code = $("#code_ov").val();
  console.log(code);

  if (!code) {
    let message = "Verification code cannot be blank";
    $("#error_msg_stepup").text(message);
    $("#error_msg_stepup").show();
    return;
  }

  let body = {
    passCode: code,
  };

  $.ajax({
    url: `/api/verifyFactor/${factor.id}`,
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("verify success!");
      console.log(response);

      mfaValidated(response);
    })
    .fail(function (err, textStatus) {
      showError(err);
    });
}

// Google Authenticator

function showGoogleStepup() {
  console.log("showGoogleStepup");

  hideAllStepup();
  $("#google_stepup").fadeIn("slow");

  let factor = listedFactors.find(
    (o) => o.factorType === "token:software:totp" && o.provider === "GOOGLE"
  );

  console.log(factor.id);

  initializeGoogleStepup();
}

function initializeGoogleStepup() {
  console.log("showGoogleStepup");

  $("#code_google").text("");
}

function verifyGoogle() {
  console.log("verifyGoogle");

  let factor = listedFactors.find(
    (o) => o.factorType === "token:software:totp" && o.provider === "GOOGLE"
  );
  console.log(factor.id);

  let code = $("#code_google").val();
  console.log(code);

  if (!code) {
    let message = "Verification code cannot be blank";
    $("#error_msg_stepup").text(message);
    $("#error_msg_stepup").show();
    return;
  }

  let body = {
    passCode: code,
  };

  $.ajax({
    url: `/api/verifyFactor/${factor.id}`,
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("verify success!");
      console.log(response);

      mfaValidated(response);
    })
    .fail(function (err, textStatus) {
      showError(err);
    });
}

// Webauthn

function showWebauthnStepup() {
  console.log("showWebauthnStepup");

  hideAllStepup();
  $("#retry_webauthn").hide();
  $("#webauthn_stepup").fadeIn("slow");

  // let factor = listedFactors.find((o) => o.factorType === "webauthn");

  challengeWebauthn();
}

const fn = {};

/**
 * Converts any url safe characters in a base64 string to regular base64 characters
 * @param str base64 string that might contain url safe characters
 * @returns base64 formatted string
 */
fn.base64UrlSafeToBase64 = function (str) {
  return str
    .replace(new RegExp("_", "g"), "/")
    .replace(new RegExp("-", "g"), "+");
};

/**
 * Converts an ArrayBuffer object that contains binary data to base64 encoded string
 * @param bin ArrayBuffer object
 * @returns base64 encoded string
 */
fn.binToStr = function (bin) {
  return btoa(
    new Uint8Array(bin).reduce((s, byte) => s + String.fromCharCode(byte), "")
  );
};

/**
 * Converts base64 string to binary data view
 * @param str in base64 or base64UrlSafe format
 * @returns converted Uint8Array view of binary data
 */
fn.strToBin = function (str) {
  return Uint8Array.from(atob(this.base64UrlSafeToBase64(str)), (c) =>
    c.charCodeAt(0)
  );
};

function challengeWebauthn() {
  console.log("challengeWebauthn");

  let factors = listedFactors.filter((o) => o.factorType === "webauthn");
  console.log(factors);
  let factorid = factors[0].id;

  $("#error_msg_stepup").hide();
  $("#warning_msg_stepup").hide();

  $("#retry_webauthn").hide();

  $.ajax({
    url: `/api/verifyFactor/${factorid}`,
    method: "POST",
  })
    .then(function (response) {
      console.log("challengeWebauthn success!");
      console.log(response);

      let challenge = response._embedded.challenge.challenge;
      console.log(challenge);

      let factors = response._embedded.enrolledFactors.filter(
        (o) => o.factorType === "webauthn"
      );
      let credIds = factors.map((o) => o.profile.credentialId);

      let allowCredentials = [];
      credIds.forEach((cred) => {
        if (cred) {
          allowCredentials.push({
            type: "public-key",
            id: fn.strToBin(cred),
          });
        }
      });

      console.log(allowCredentials);

      const options = {
        challenge: fn.strToBin(challenge),
        // rpId: rpid, // this can't be a public suffix e.g. "glitch.me"

        allowCredentials: allowCredentials,

        userVerification: "preferred",
        //extensions: {},
      };

      console.log(options);
      return options;
    })
    .then((options) => navigator.credentials.get({ publicKey: options }))
    .then(function (assertion) {
      console.log(assertion);

      // Get the client data, authenticator data, and signature data from callback result, convert from binary to string

      let clientData = fn.binToStr(assertion.response.clientDataJSON);
      let authenticatorData = fn.binToStr(assertion.response.authenticatorData);
      let signatureData = fn.binToStr(assertion.response.signature);

      console.log(clientData);
      console.log(authenticatorData);
      console.log(signatureData);

      // todo: verify webauthn

      let body = {
        clientData: clientData,
        authenticatorData: authenticatorData,
        signatureData: signatureData,
      };

      console.log(body);
      return body;
    })
    .then((body) =>
      $.ajax({
        url: `/api/verifyFactor/${factorid}`,
        method: "POST",
        data: body,
      })
    )
    .then((response) => {
      console.log("verify webauthn success!");
      console.log(response);

      mfaValidated(response);
    })
    .fail(function (err, textStatus) {
      showError(err);

      $("#retry_webauthn").show();
    });
}


function checkTransfer() {
  console.log("checkTransfer");

  let amount = $("#amount").val();
  console.log(amount);

  // todo: have two tiers of step up?

  if (amount < 1000) {
    console.log("don't do step up mfa");
    doTransfer();
  } else {
    console.log("do step up mfa");
    showStepUp(runmyscript);
  }
}

function doTransfer() {
  console.log("doTransfer");

  let amount = $("#amount").val();
  let msg =
    "$" + amount + " transfered to: " + $("#to_account").dropdown("get text");
  $("#transfer_success_msg").fadeIn();
  $("#transfer_success_msg").text(msg);

  setTimeout("hideMessages()", messageDelay);
}

function denyTransfer() {
  console.log("denyTransfer");
  let msg = "Unable to validate Step up MFA. Transfer denied.";
  $("#transfer_error_msg").fadeIn();
  $("#transfer_error_msg").text(msg);

  setTimeout("hideMessages()", messageDelay);
}

function runmyscript() {
  console.log("runmyscript");
  console.log(verifyResponse);

  if (verifyResponse.factorResult === "SUCCESS") {
    doTransfer();
  } else {
    denyTransfer();
  }
}
