// add factorType_provider for any supported factors
const factorTypeMap = {
  sms_OKTA: 'sms',
  call_OKTA: 'call',
  question_OKTA: 'question',
  push_OKTA: 'ov',
  'token:software:totp_OKTA': 'ov',
  email_OKTA: 'email',
  webauthn_FIDO: 'webauthn',
  'token:software:totp_GOOGLE': 'google'
};


const factorAttrs = {
  sms: {
    name: "SMS",
    iconUrl: "https://cdn.glitch.global/108d8383-74d9-4080-9432-486b3f71ad74/sms_38x38.png?v=1648214837545"
  },
  call: {
    name: "Voice Call",
    iconUrl: "https://cdn.glitch.global/108d8383-74d9-4080-9432-486b3f71ad74/voicecall_38x38.png?v=1648214837268"
  },
  question: {
    name: "Security Question",
    iconUrl: "https://cdn.glitch.global/108d8383-74d9-4080-9432-486b3f71ad74/question_38x38.png?v=1648214852200"
  },
  ov: {
    name: "Okta Verify",
    iconUrl: "https://cdn.glitch.global/108d8383-74d9-4080-9432-486b3f71ad74/oktaVerify_38x38.png?v=1648214837364"
  },
  email: {
    name: "Email",
    iconUrl: "https://cdn.glitch.global/108d8383-74d9-4080-9432-486b3f71ad74/email_38x38.png?v=1648214837403"
  },
  webauthn: {
    name: "Security Key or Biometric Authenticator",
    iconUrl: "https://cdn.glitch.global/108d8383-74d9-4080-9432-486b3f71ad74/webauthn_38x38.png?v=1648214837268"
  },
  google: {
    name: "Google Authenticator",
    iconUrl: "https://cdn.glitch.global/108d8383-74d9-4080-9432-486b3f71ad74/googleAuth_38x38.png?v=1648214837511"
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
  factors.forEach(factor => {
    if (isSupportedFactor(factor.factorType, factor.provider)) {
      let type = getType(factor.factorType, factor.provider);
      items[type] = { name: getName(type), value: type };
    }
  });
  
  // return values list
  return Object.values(items);
}

function getIconUrl(type) {
  console.log("getIconUrl");
  console.log(type);
  return factorAttrs[type].iconUrl;
}

function getFactor(factors, factorType, provider) {
  let obj = factors.find(o => o.factorType === factorType && o.provider === provider);
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