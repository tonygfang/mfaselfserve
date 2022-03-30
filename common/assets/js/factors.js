var factoridEmail;
var factoridSMS;
var factoridCall;
var factoridOV;
var factoridOVNoPush;
var factoridGoogle;
var factoridWebauthn;

const resendDelayEmail = 10000;
const resendDelaySMS = 10000;
const resendDelayCall = 10000;
const pollDelayPush = 10000;
const reloadPageDelay = 500;

function reloadPage() {
  // todo: is there a better way to close the popups?
  window.location.reload();
}

$(document).ready(function () {
  
  // initialize semantic dropdowns
  $('.ui.dropdown').dropdown();
  
  // initialize popups

  // call
  $("#errmsg_call").hide();
  $("#resend_msg_call").hide();
  $("#resend_button_call").hide();
  $("#verify_ui_call").hide();

  // email
  $("#errmsg_email").hide();
  $("#resend_ui_email").hide();
  $("#verify_ui_email").hide();

  // push
  $("#errmsg_push").hide();
  $("#verify_qrcode_ui_push").hide();
  $("#img_check_push").hide();
  $("#verify_cantscan_ui_push").hide();
  $("#verify_cantscan_email_ui_push").hide();
  $("#verify_cantscan_secret_ui_push").hide();
  $("#verify_cantscan_secret_nopush").hide();
  $("#verify_cantscan_code_nopush").hide();
  $("#verify_cantscan_sms_ui_push").hide();
  $("#activate_sms_sent_push").hide();
  $("#activate_email_sent_push").hide();

  $('#cantscan_setup_option_push').dropdown('setting', 'onChange', function(value, text) {
    console.log(`cantscan_setup_option_push onChange ${value} ${text}`);
    if (value == "sms") {
      showPushSMS();
    } else if (value == "email") {
      showPushEmail();
    } else if (value == "nopush") {
      showNoPush();
    } 
  });
  
  $('#cantscan_setup_option_push').dropdown('set selected', 'sms');
  
  // google
  $("#errmsg_google").hide();
  $("#verify_qrcode_google").hide();
  $("#verify_cantscan_google").hide();
  $("#verify_code_google").hide();

  // question
  $("#errmsg_question").hide();

  // sms
  $("#errmsg_sms").hide();
  $("#resend_msg_sms").hide();
  $("#resend_button_sms").hide();
  $("#verify_ui_sms").hide();

  // webauthn
  $("#errmsg_webauthn").hide();

  
});

function enrollQuestion() {
  console.log("enrollQuestion");

  let question = $("#question").dropdown('get value');
  let answer = $("#answer").val();

  let body = {
    factorType: "question",
    provider: "OKTA",
    profile: {
      question: question,
      answer: answer,
    },
  };
  console.log(body);

  $.ajax({
    url: "/api/enrollFactor",
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("xx success");
      console.log(response);

      reloadPage();
    })
    .fail(function (jqXHR, textStatus) {
      // console.error('xx error');
      // console.error(jqXHR);
      console.error(jqXHR.responseText);

      $("#errmsg_question").text(jqXHR.responseText);
      $("#errmsg_question").show();
    });
}

function enrollEmail(email) {
  console.log("enrollEmail " + email);

  let body = {
    factorType: "email",
    provider: "OKTA",
    profile: {
      email: email,
    },
  };
  console.log(body);

  $.ajax({
    url: "/api/enrollFactor",
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("xx enroll success!");
      console.log(response);

      factoridEmail = response.id;

      $("#enroll_ui_email").hide();
      $("#resend_ui_email").hide().delay(resendDelayEmail).fadeIn("slow");
      $("#verify_ui_email").show();

      return response;
    })
    .fail(function (jqXHR, textStatus) {
      // console.error('xx error');
      // console.error(jqXHR);
      console.error(jqXHR.responseText);

      $("#errmsg_email").text(jqXHR.responseText);
      $("#errmsg_email").show();
    });
}

function activateEmail() {
  console.log("activateEmail");

  let code = $("#code_email").val();

  let body = {
    passCode: code,
  };
  console.log(factoridEmail);
  console.log(body);

  $.ajax({
    url: `/api/activateFactor/${factoridEmail}`,
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("xx activate success!");
      console.log(response);

      $("#errmsg_email").fadeOut("slow");
      reloadPage();
    })
    .fail(function (jqXHR, textStatus) {
      console.error(jqXHR.responseText);

      $("#errmsg_email").text(jqXHR.responseText);
      $("#errmsg_email").show();
    });
}

function resendEmail(email) {
  console.log("resendEmail");
  $("#errmsg_email").fadeOut("slow");

  let body = {
    factorType: "email",
    provider: "OKTA",
    profile: {
      email: email,
    },
  };
  console.log(body);
  console.log(factoridEmail);
  console.log(body);

  $.ajax({
    url: `/api/resendFactor/${factoridEmail}`,
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("xx resend success!");
      console.log(response);

      $("#resend_ui_email").hide().delay(5000).fadeIn("slow");
    })
    .fail(function (jqXHR, textStatus) {
      console.error(jqXHR.responseText);

      $("#errmsg_email").text(jqXHR.responseText);
      $("#errmsg_email").show();
    });
}

function showResendSMS() {
  console.log("showResendSMS");
  $("#enroll_button_sms").hide();
  $("#resend_button_sms").prop("disabled", true);
  $("#resend_button_sms").show();
  $("#resend_msg_sms").fadeIn("slow");
}

function enrollSMS() {
  console.log("enrollSMS");

  let phone = $("#phone_sms").val();

  let body = {
    factorType: "sms",
    provider: "OKTA",
    profile: {
      phoneNumber: phone,
    },
  };
  console.log(body);

  $.ajax({
    url: "/api/enrollFactor",
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("enrollSMS success!");
      console.log(response);
      console.log(response.id);
      console.log(response.status);

      factoridSMS = response.id;

      if (response.status === "ACTIVE") {
        console.log("phone number previously verified");
        console.log("factor is active!");

        // todo: show message, quit here? or challenge/verify on an active factor?
        window.location.reload();
      } else {
        $("#enroll_button_sms").prop("disabled", true);
        $("#verify_ui_sms").show();

        setTimeout("showResendSMS()", resendDelaySMS);
      }
    })
    .fail(function (jqXHR, textStatus) {
      // console.error('xx error');
      // console.error(jqXHR);
      console.error(jqXHR.responseText);

      $("#errmsg_sms").text(jqXHR.responseText);
      $("#errmsg_sms").show();
    });
}

function resendSMS() {
  console.log("resendSMS");
  $("#errmsg_sms").fadeOut("slow");

  let phone = $("#phone_sms").val();

  let body = {
    factorType: "sms",
    provider: "OKTA",
    profile: {
      phoneNumber: phone,
    },
  };
  console.log(body);

  $.ajax({
    url: `/api/resendFactor/${factoridSMS}`,
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("resendSMS success!");
      console.log(response);

      factoridSMS = response.id;

      if (response.status === "ACTIVE") {
        console.log("phone number previously verified");
        console.log("factor is active!");

        // todo: show message?
        setTimeout("reloadPage()", reloadPageDelay);
      } else {
        $("#resend_button_sms").prop("disabled", true);
        $("#resend_msg_sms").hide();
        setTimeout("showResendSMS()", resendDelaySMS);
      }
    })
    .fail(function (jqXHR, textStatus) {
      // console.error('xx error');
      // console.error(jqXHR);
      console.error(jqXHR.responseText);

      $("#errmsg_sms").text(jqXHR.responseText);
      $("#errmsg_sms").show();
    });
}

function activateSMS() {
  console.log("activateSMS");

  let code = $("#code_sms").val();

  let body = {
    passCode: code,
  };
  console.log(factoridSMS);
  console.log(body);

  $.ajax({
    url: `/api/activateFactor/${factoridSMS}`,
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("xx activate success!");
      console.log(response);

      $("#errmsg_sms").fadeOut("slow");
      setTimeout("reloadPage()", reloadPageDelay);
    })
    .fail(function (jqXHR, textStatus) {
      console.error(jqXHR.responseText);

      $("#errmsg_sms").text(jqXHR.responseText);
      $("#errmsg_sms").show();
    });
}

function showResendCall() {
  console.log("showResendCall");
  $("#enroll_button_call").hide();
  $("#resend_button_call").prop("disabled", false);
  $("#resend_button_call").show();
  $("#resend_msg_call").fadeIn("slow");
}

function enrollCall() {
  console.log("enrollCall");

  let phone = $("#phone_call").val();
  let ext = $("#ext_call").val();

  let body = {
    factorType: "call",
    provider: "OKTA",
    profile: {
      phoneNumber: phone,
      phoneExtension: ext,
    },
  };
  console.log(body);

  $.ajax({
    url: "/api/enrollFactor",
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("enrollCall success!");
      console.log(response);
      console.log(response.id);
      console.log(response.status);

      factoridCall = response.id;

      if (response.status === "ACTIVE") {
        console.log("phone number previously verified");
        console.log("factor is active!");

        // todo: quit here? or challenge/verify on an active factor?
        setTimeout("reloadPage()", reloadPageDelay);
      } else {
        $("#enroll_button_call").prop("disabled", true);
        $("#verify_ui_call").show();

        setTimeout("showResendCall()", resendDelayCall);
      }
    })
    .fail(function (jqXHR, textStatus) {
      // console.error('xx error');
      // console.error(jqXHR);
      console.error(jqXHR.responseText);

      $("#errmsg_call").text(jqXHR.responseText);
      $("#errmsg_call").show();
    });
}

function resendCall() {
  console.log("resendCall");

  $("#errmsg_call").fadeOut("slow");

  let phone = $("#phone_call").val();
  let ext = $("#ext_call").val();

  let body = {
    factorType: "call",
    provider: "OKTA",
    profile: {
      phoneNumber: phone,
      phoneExtension: ext,
    },
  };
  console.log(body);

  $.ajax({
    url: `/api/resendFactor/${factoridCall}`,
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("resendCall success!");
      console.log(response);

      factoridCall = response.id;

      if (response.status === "ACTIVE") {
        console.log("phone number previously verified");
        console.log("factor is active!");

        setTimeout("reloadPage()", reloadPageDelay);
      } else {
        $("#resend_button_call").prop("disabled", true);
        $("#resend_msg_call").hide();
        setTimeout("showResendCall()", resendDelayCall);
      }
    })
    .fail(function (jqXHR, textStatus) {
      // console.error('xx error');
      // console.error(jqXHR);
      console.error(jqXHR.responseText);

      $("#errmsg_call").text(jqXHR.responseText);
      $("#errmsg_call").show();
    });
}

function activateCall() {
  console.log("activateCall");

  let code = $("#code_call").val();

  let body = {
    passCode: code,
  };
  console.log(factoridCall);
  console.log(body);

  $.ajax({
    url: `/api/activateFactor/${factoridCall}`,
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("xx activate success!");
      console.log(response);

      $("#errmsg_call").fadeOut("slow");
      setTimeout("reloadPage()", reloadPageDelay);
    })
    .fail(function (jqXHR, textStatus) {
      console.error(jqXHR.responseText);

      $("#errmsg_call").text(jqXHR.responseText);
      $("#errmsg_call").show();
    });
}

function showPushCantScan() {
  console.log("showPushCantScan");

  $("#activate_sms_sent_push").hide();
  $("#activate_email_sent_push").hide();

  $("#verify_qrcode_ui_push").hide();
  $("#verify_cantscan_ui_push").show();
  showPushSMS();
}

function showPushSMS() {
  console.log("showPushSMS");

  $("#verify_cantscan_sms_ui_push").show();
  $("#verify_cantscan_email_ui_push").hide();
  $("#verify_cantscan_ui_nopush").hide();
}

function showPushEmail() {
  console.log("showPushEmail");

  $("#verify_cantscan_sms_ui_push").hide();
  $("#verify_cantscan_email_ui_push").show();
  $("#verify_cantscan_ui_nopush").hide();
}

function showPushEmailSent() {
  console.log("showPushEmail");
  
  $("#errmsg_push").hide();
  $("#verify_cantscan_ui_push").hide();
  $("#activate_email_sent_push").show();
}

function showPushSMSSent() {
  console.log("showPushEmail");
  
  $("#errmsg_push").hide();
  $("#verify_cantscan_ui_push").hide();
  $("#activate_sms_sent_push").show();
}

function showNoPush() {
  console.log("showNoPush");
  
  // aka enroll ov no push
  
  let body = {
    factorType: "token:software:totp",
    provider: "OKTA",
  };
  
  $.ajax({
    url: "/api/enrollFactor",
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("enroll ov no push success!");
      // console.log(response);
      console.log(response.id);
      console.log(response.status);

      factoridOVNoPush = response.id;

      let secret = response._embedded.activation.sharedSecret;
      console.log(`secret: ${secret}`);
    
      $("#verify_cantscan_ui_nopush").show();
      $("#verify_cantscan_secret_nopush").show();
      $("#verify_cantscan_code_nopush").hide();

      $("#verify_cantscan_sms_ui_push").hide();
      $("#verify_cantscan_email_ui_push").hide();

      $("#secret_nopush").text(secret);
    })
    .fail(function (jqXHR, textStatus) {
      // console.error('xx error');
      // console.error(jqXHR);
      console.error(jqXHR.responseText);

      $("#errmsg_push").text(jqXHR.responseText);
      $("#errmsg_push").show();
    });
}

function secretNextNoPush() {
  console.log("secretNextNoPush");
  
  $("#verify_cantscan_secret_nopush").hide();
  $("#verify_cantscan_code_nopush").show();
}

function activateNoPush() {
  console.log("activateNoPush");

  let code = $("#code_nopush").val();

  let body = {
    passCode: code,
  };
  console.log(factoridOVNoPush);
  console.log(body);

  $.ajax({
    url: `/api/activateFactor/${factoridOVNoPush}`,
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("xx activate success!");
      console.log(response);

      $("#errmsg_push").fadeOut("slow");
      setTimeout("reloadPage()", reloadPageDelay);
    })
    .fail(function (jqXHR, textStatus) {
      console.error(jqXHR.responseText);

      $("#errmsg_push").text(jqXHR.responseText);
      $("#errmsg_push").show();
    });
  
}

function showPushQRCode() {
  console.log("showPushQRCode");

  $("#verify_cantscan_ui_push").hide();
  $("#verify_qrcode_ui_push").show();
}

function showPushEnroll() {
  console.log("showPushEnroll");

  $("#enroll_ui_push").show();
  $("#verify_qrcode_ui_push").hide();
  $("#verify_cantscan_ui_push").hide();
}

function enrollPush() {
  console.log("enrollPush");

  let body = {
    factorType: "push",
    provider: "OKTA",
  };
  // console.log(body);

  $.ajax({
    url: "/api/enrollFactor",
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("enrollPush success!");
      // console.log(response);
      console.log(response.id);
      console.log(response.status);

      factoridOV = response.id;

      let qrcode = response._embedded.activation._links.qrcode.href;
      console.log(`qrcode: ${qrcode}`);

      // let pollUrl = response._links.poll.href;
      // console.log(`pollUrl: ${pollUrl}`);

      let sendList = response._embedded.activation._links.send;
      let smsObj = sendList.find((x) => x.name === "sms");
      let smsUrl = smsObj.href;
      console.log(`smsUrl: ${smsUrl}`);

      let emailObj = sendList.find((x) => x.name === "email");
      let emailUrl = emailObj.href;
      console.log(`emailUrl: ${emailUrl}`);

      $("#enroll_ui_push").hide();
      $("#img_qrcode_push").attr("src", qrcode);
      showPushQRCode();

      setTimeout(pollPush, pollDelayPush);
    })
    .fail(function (jqXHR, textStatus) {
      // console.error('xx error');
      // console.error(jqXHR);
      console.error(jqXHR.responseText);

      $("#errmsg_push").text(jqXHR.responseText);
      $("#errmsg_push").show();
    });
}

function pollPush() {
  console.log("pollPush");

  $.ajax({
    url: `/api/pollFactor/${factoridOV}`,
    method: "POST",
  })
    .done(function (response) {
      console.log("pollFactor success!");
      console.log(response);

      if (response.status === "ACTIVE") {
        console.log("success!");
        $("#img_check_push").fadeIn("slow");

        setTimeout("reloadPage()", reloadPageDelay);
      } else {
        console.log(`factorResult: ${response.factorResult}`);

        switch (response.factorResult) {
          case "WAITING":
            console.log("waiting, set the timeout again");
            setTimeout(pollPush, pollDelayPush);
            break;

          case "SUCCESS":
            // does it ever get here?
            console.log("success!");
            $("#img_check_push").fadeIn("slow");

            setTimeout("reloadPage()", reloadPageDelay);
            break;

          case "REJECTED":
          case "TIMEOUT":
            $("#errmsg_push").text(`Push request ${response.factorResult}`);
            $("#errmsg_push").show();

            // go back to enroll push
            showPushEnroll();
            break;
        }
      }
    })
    .fail(function (jqXHR, textStatus) {
      console.error(jqXHR.responseText);

      $("#errmsg_push").text(jqXHR.responseText);
      $("#errmsg_push").show();
    });
}

function sendPushActivationSMS() {
  console.log("sendPushActivationSMS");

  let phone = $("#phone_push").val();
  let body = {
    factorType: "push",
    provider: "OKTA",
    profile: {
      phoneNumber: phone,
    },
  };
  console.log(body);

  $.ajax({
    url: `/api/sendPushFactorActivation/${factoridOV}/sms`,
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("sendPushActivationSMS success!");
      // console.log(response);
      console.log(response.id);
      console.log(response.status);

      showPushSMSSent();
    })
    .fail(function (jqXHR, textStatus) {
      // console.error('xx error');
      // console.error(jqXHR);
      console.error(jqXHR.responseText);

      $("#errmsg_push").text(jqXHR.responseText);
      $("#errmsg_push").show();
    });
}

function sendPushActivationEmail() {
  console.log("sendPushActivationEmail");

  $.ajax({
    url: `/api/sendPushFactorActivation/${factoridOV}/email`,
    method: "POST",
  })
    .done(function (response) {
      console.log("sendPushActivationSMS success!");
      // console.log(response);
      console.log(response.id);
      console.log(response.status);

      showPushEmailSent();
    })
    .fail(function (jqXHR, textStatus) {
      // console.error('xx error');
      // console.error(jqXHR);
      console.error(jqXHR.responseText);

      $("#errmsg_push").text(jqXHR.responseText);
      $("#errmsg_push").show();
    });
}

function showGoogleQRCode() {
  console.log("showGoogleQRCode");

  $("#verify_qrcode_google").show();
  $("#verify_cantscan_google").hide();
}

function showGoogleCantScan() {
  console.log("showGoogleCantScan");

  $("#verify_qrcode_google").hide();
  $("#verify_cantscan_google").show();
}

function showVerifyGoogle() {
  console.log("showVerifyGoogle");
  
  $("#verify_qrcode_google").hide();
  $("#verify_cantscan_google").hide();
  
  $("#verify_code_google").show();
}

function enrollGoogle() {
  console.log("enrollGoogle");

  let body = {
    factorType: "token:software:totp",
    provider: "GOOGLE",
  };

  $.ajax({
    url: "/api/enrollFactor",
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("enrollGoogle success!");
      // console.log(response);
      console.log(response.id);
      console.log(response.status);

      factoridGoogle = response.id;

      let qrcode = response._embedded.activation._links.qrcode.href;
      console.log(`qrcode: ${qrcode}`);

      let secret = response._embedded.activation.sharedSecret;
      console.log(`secret: ${secret}`);
      $("#secret_google").text(secret);

      $("#enroll_google").hide();
      $("#img_qrcode_google").attr("src", qrcode);
      showGoogleQRCode();
    })
    .fail(function (jqXHR, textStatus) {
      // console.error('xx error');
      // console.error(jqXHR);
      console.error(jqXHR.responseText);

      $("#errmsg_google").text(jqXHR.responseText);
      $("#errmsg_google").show();
    });
}

function activateGoogle() {
  console.log("activateGoogle");

  let code = $("#code_google").val();

  let body = {
    passCode: code,
  };
  console.log(factoridGoogle);
  console.log(body);

  $.ajax({
    url: `/api/activateFactor/${factoridGoogle}`,
    method: "POST",
    data: body,
  })
    .done(function (response) {
      console.log("xx activateGoogle success!");
      console.log(response);

      $("#errmsg_google").fadeOut("slow");
      setTimeout("reloadPage()", reloadPageDelay);
    })
    .fail(function (jqXHR, textStatus) {
      console.error(jqXHR.responseText);

      $("#errmsg_google").text(jqXHR.responseText);
      $("#errmsg_google").show();
    });
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

function enrollWebauthn() {
  console.log("enrollWebauthn");

  let body = {
    factorType: "webauthn",
    provider: "FIDO",
  };
  // console.log(body);

  $.ajax({
    url: "/api/enrollFactor",
    method: "POST",
    data: body,
  })
    .then(function (response) {
      console.log("enrollWebauthn success!");
      console.log(response);
      console.log(response.id);
      console.log(response.status);

      factoridWebauthn = response.id;

      // console.log(response._embedded.activation);
      console.log(response._embedded.activation.challenge);
      console.log(response._embedded.activation.user.id);
    
      response._embedded.activation.challenge = fn.strToBin(
        response._embedded.activation.challenge
      );
      response._embedded.activation.user.id = fn.strToBin(
        response._embedded.activation.user.id
      );

      // console.log(response._embedded.activation);
      console.log(response._embedded.activation.challenge);
      console.log(response._embedded.activation.user.id);

      // let cred = {
      //   publicKey: response._embedded.activation,
      // };
      let cred = {
        publicKey: {
          rp: response._embedded.activation.rp,
          user: response._embedded.activation.user,
          challenge: response._embedded.activation.challenge,
          pubKeyCredParams: response._embedded.activation.pubKeyCredParams,
          attestation: response._embedded.activation.attestation,
          authenticatorSelection: response._embedded.activation.authenticatorSelection
        }
      }
      console.log(cred);

      return cred;
    })
    .then((cred) => navigator.credentials.create(cred))
    .then((cred) => {
      // navigator.credentials is a global object on WebAuthn-supported clients, used to access WebAuthn API

      // Get attestation and clientData from callback result, convert from binary to string
      console.log(cred.response.attestationObject);
      console.log(cred.response.clientDataJSON);

      let body = {
        attestation: fn.binToStr(cred.response.attestationObject),
        clientData: fn.binToStr(cred.response.clientDataJSON)
      };
      console.log(body);

      return body;
    })
    .then((body) => $.ajax({
      url: `/api/activateFactor/${factoridWebauthn}`,
      method: "POST",
      data: body,
    }))
    .then(response => {
      console.log("enrollWebauthn activate success!");
      console.log(response);
      $("#errmsg_webauthn").hide();
      

      setTimeout("reloadPage()", reloadPageDelay);    
    
    })
    .fail(function (err, textStatus) {
      // console.error('xx error');
      console.error(err);
      console.error(err.responseText);
    
      let errmsg = err;
      if (err.responseText) {
        errmsg = err.responseText;
      }
      

      $("#errmsg_webauthn").text(errmsg);
      $("#errmsg_webauthn").show();
    });
}
