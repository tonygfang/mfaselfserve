// add factorType_provider for any supported factors
const factorTypeMap = {
  question_OKTA: "question",
  sms_OKTA: "sms",
  call_OKTA: "call",
  email_OKTA: "email",
  push_OKTA: "ov",
  "token:software:totp_OKTA": "ov",
  "token:software:totp_GOOGLE": "google",
  webauthn_FIDO: "webauthn",
};

const factorAttrs = {
  question: {
    name: "Security Question",
    icon: "https://global.oktacdn.com/okta-signin-widget/6.0.0/img/icons/mfa/question_38x38.png",
    logo: "https://global.oktacdn.com/okta-signin-widget/6.0.0/img/icons/mfa/question_70x70.png",
  },
  sms: {
    name: "SMS",
    icon: "https://global.oktacdn.com/okta-signin-widget/6.0.0/img/icons/mfa/sms_38x38.png",
    logo: "https://global.oktacdn.com/okta-signin-widget/6.0.0/img/icons/mfa/sms_70x70.png",
  },
  call: {
    name: "Voice Call",
    icon: "https://global.oktacdn.com/okta-signin-widget/6.0.0/img/icons/mfa/voicecall_38x38.png",
    logo: "https://global.oktacdn.com/okta-signin-widget/6.0.0/img/icons/mfa/voicecall_70x70.png",
  },
  email: {
    name: "Email",
    icon: "https://global.oktacdn.com/okta-signin-widget/6.0.0/img/icons/mfa/email_38x38.png",
    logo: "https://global.oktacdn.com/okta-signin-widget/6.0.0/img/icons/mfa/email_70x70.png",
  },
  ov: {
    name: "Okta Verify",
    icon: "https://global.oktacdn.com/okta-signin-widget/6.0.0/img/icons/mfa/oktaVerify_38x38.png",
    logo: "https://global.oktacdn.com/okta-signin-widget/6.0.0/img/icons/mfa/oktaVerify_70x70.png",
  },
  google: {
    name: "Google Authenticator",
    icon: "https://global.oktacdn.com/okta-signin-widget/6.0.0/img/icons/mfa/googleAuth_38x38.png",
    logo: "https://global.oktacdn.com/okta-signin-widget/6.0.0/img/icons/mfa/googleAuth_70x70.png",
  },
  webauthn: {
    name: "Security Key or Biometric Authenticator",
    icon: "https://global.oktacdn.com/okta-signin-widget/6.0.0/img/icons/mfa/webauthn_38x38.png",
    logo: "https://global.oktacdn.com/okta-signin-widget/6.0.0/img/icons/mfa/webauthn_70x70.png",
  },
};

function isSupportedFactor(type, provider) {
  let supportedFactors = Object.keys(factorTypeMap);
  let key = `${type}_${provider}`;
  let result = supportedFactors.includes(key);

  return result;
}

function getName(type) {
  console.log("getName");
  return factorAttrs[type].name;
}

function getType(factorType, provider) {
  let key = `${factorType}_${provider}`;
  let type = factorTypeMap[key];

  return type;
}

function getDropdownItems(factors) {
  // add supported factors to object with type as key
  // this will avoid dupe entries (OV, webauthn)
  let items = {};
  factors.forEach((factor) => {
    if (isSupportedFactor(factor.factorType, factor.provider)) {
      let type = getType(factor.factorType, factor.provider);
      items[type] = { name: getName(type), value: type };
    }
  });

  // return values list
  return Object.values(items);
}

function getFactorsByType(factors) {
  // add supported factors to object with type as key
  // this will avoid dupe entries (OV, webauthn)
  let items = {};
  factors.forEach((factor) => {
    if (isSupportedFactor(factor.factorType, factor.provider)) {
      let type = getType(factor.factorType, factor.provider);
      items[type] = {
        type: type,
        name: getName(type),
        icon: getIcon(type),
      };
    }
  });

  // return values list
  return Object.values(items);
}

function getIcon(type) {
  console.log("getIcon");
  console.log(type);
  return factorAttrs[type].icon;
}

function getLogo(type) {
  console.log("getLogo");
  console.log(type);
  return factorAttrs[type].logo;
}

function getFactor(factors, factorType, provider) {
  let obj = factors.find(
    (o) => o.factorType === factorType && o.provider === provider
  );
  return obj;
}

function maskEmail(email) {
  let name = email.substring(0, email.lastIndexOf("@"));
  let domain = email.substring(email.lastIndexOf("@") + 1);

  let result = `${name.substring(0, 1)}...${name.substring(
    name.length - 1
  )}@${domain}`;

  return result;
}

function maskPhone(phone) {
  console.log("maskPhone");

  console.log(phone);

  let phoneStart = phone.substring(0, 2);

  console.log(phoneStart);

  let maskLength = phone.length - 2 - 4;
  let maskedNumbers = "X".repeat(maskLength);

  console.log(maskLength);
  console.log(maskedNumbers);

  let phoneEnd = phone.substring(maskLength + 2);

  console.log(phoneEnd);

  let result = `${phoneStart}${maskedNumbers}${phoneEnd}`;
  console.log(result);

  return result;
}
