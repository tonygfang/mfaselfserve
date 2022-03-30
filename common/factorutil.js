
const factorMap = {
  sms_OKTA: {
    factorType: "sms",
    clientId: process.env.SMS_CLIENT_ID,
    name: "SMS",
    iconUrl: "https://cdn.glitch.global/108d8383-74d9-4080-9432-486b3f71ad74/sms_38x38.png?v=1648214837545"
  },
  call_OKTA: {
    factorType: "call",
    clientId: process.env.VOICE_CLIENT_ID,
    name: "Voice Call",
    iconUrl: "https://cdn.glitch.global/108d8383-74d9-4080-9432-486b3f71ad74/voicecall_38x38.png?v=1648214837268"
  },
  question_OKTA: {
    factorType: "question",
    clientId: process.env.QUESTION_CLIENT_ID,
    name: "Security Question",
    iconUrl: "https://cdn.glitch.global/108d8383-74d9-4080-9432-486b3f71ad74/question_38x38.png?v=1648214852200"
  },
  push_OKTA: {
    factorType: "ov",
    clientId: process.env.OV_CLIENT_ID,
    name: "Okta Verify",
    iconUrl: "https://cdn.glitch.global/108d8383-74d9-4080-9432-486b3f71ad74/oktaVerify_38x38.png?v=1648214837364"
  },
  "token:software:totp_OKTA": {
    factorType: "ov",
    clientId: process.env.OV_CLIENT_ID,
    name: "Okta Verify",
    iconUrl: "https://cdn.glitch.global/108d8383-74d9-4080-9432-486b3f71ad74/oktaVerify_38x38.png?v=1648214837364"
  },
  email_OKTA: {
    factorType: "email",
    clientId: process.env.EMAIL_CLIENT_ID,
    name: "Email",
    iconUrl: "https://cdn.glitch.global/108d8383-74d9-4080-9432-486b3f71ad74/email_38x38.png?v=1648214837403"
  },
  webauthn_FIDO: {
    factorType: "webauthn",
    clientId: process.env.WEBAUTHN_CLIENT_ID,
    name: "Security Key or Biometric Authenticator",
    iconUrl: "https://cdn.glitch.global/108d8383-74d9-4080-9432-486b3f71ad74/webauthn_38x38.png?v=1648214837268"
  },
  "token:software:totp_GOOGLE": {
    factorType: "google",
    clientId: process.env.GOOGLE_CLIENT_ID,
    name: "Google Authenticator",
    iconUrl: "https://cdn.glitch.global/108d8383-74d9-4080-9432-486b3f71ad74/googleAuth_38x38.png?v=1648214837511"
  },
};

const questions = [
  {
    question: "name_of_first_plush_toy",
    questionText: "What is the name of your first stuffed animal?",
  },
  {
    question: "first_award",
    questionText: "What did you earn your first medal or award for?",
  },
  {
    question: "favorite_security_question",
    questionText: "What is your favorite security question?",
  },
  {
    question: "favorite_toy",
    questionText: "What is the toy/stuffed animal you liked the most as a kid?",
  },
  {
    question: "first_computer_game",
    questionText: "What was the first computer game you played?",
  },
  {
    question: "favorite_movie_quote",
    questionText: "What is your favorite movie quote?",
  },
  {
    question: "first_sports_team_mascot",
    questionText: "What was the mascot of the first sports team you played on?",
  },
  {
    question: "first_music_purchase",
    questionText: "What music album or song did you first purchase?",
  },
  {
    question: "favorite_art_piece",
    questionText: "What is your favorite piece of art?",
  },
  {
    question: "grandmother_favorite_desert",
    questionText: "What was your grandmother's favorite dessert?",
  },
  {
    question: "first_thing_cooked",
    questionText: "What was the first thing you learned to cook?",
  },
  {
    question: "childhood_dream_job",
    questionText: "What was your dream job as a child?",
  },
  {
    question: "place_where_significant_other_was_met",
    questionText: "Where did you meet your spouse/significant other?",
  },
  {
    question: "favorite_vacation_location",
    questionText: "Where did you go for your favorite vacation?",
  },
  {
    question: "new_years_two_thousand",
    questionText: "Where were you on New Year's Eve in the year 2000?",
  },
  {
    question: "favorite_speaker_actor",
    questionText: "Who is your favorite speaker/orator?",
  },
  {
    question: "favorite_book_movie_character",
    questionText: "Who is your favorite book/movie character?",
  },
  {
    question: "favorite_sports_player",
    questionText: "Who is your favorite sports player?",
  },
];

function isSupportedFactor(type, provider) {
  let supportedFactors = Object.keys(factorMap);
  let key = `${type}_${provider}`;
  let result = supportedFactors.includes(key);
  
  return result;
}

function getName(type, provider) {
  console.log("getName");
  let key = `${type}_${provider}`;
  console.log(key);
  let factor = factorMap[key];
  console.log(factor);
  
  let name = factor.name;
  console.log(name);
  
  return name;
}

function getType(factorType, provider) {
  let key = `${factorType}_${provider}`;
  let type = factorMap[key].factorType;
  
  return type;
}

const mfaRedirectUrl = `https://${process.env.PROJECT_DOMAIN}.glitch.me/mfa`;

function getSetupLink(factorType, provider) {
  let key = `${factorType}_${provider}`;
  console.log(key);
  let factor = factorMap[key];
  console.log(factor);
  
  let clientId = factor.clientId;
  let link = `${process.env.OKTA_URL}/oauth2/${process.env.AUTHORIZATION_SERVER}/v1/authorize?client_id=${clientId}&nonce=abc&redirect_uri=${mfaRedirectUrl}&response_type=code&scope=openid&state=abc`;

  return link;
}

function maskEmail(email) {
  let name = email.substring(0, email.lastIndexOf("@"));
  let domain = email.substring(email.lastIndexOf("@") + 1);

  let result = `${name.substring(0, 1)}...${name.substring(
    name.length - 1
  )}@${domain}`;
  
  return result;
}

function getErrorMessage(err) {
  console.log(err.errorCode);
  console.log(err.errorSummary);
  console.log(err.message);

  let msg = err.errorSummary;

  if (
    (err.errorCode === "E0000001" || err.errorCode === "E0000068") &&
    err.errorCauses.length > 0
  ) {
    msg = err.errorCauses[0].errorSummary;
  }
  console.log(msg);

  return msg;
}

function getIconUrl(factorType, provider) {
  let key = `${factorType}_${provider}`;
  let iconUrl = factorMap[key].iconUrl;
  
  return iconUrl;
}

module.exports = {
  // factorTypes,
  // factorMap,
  questions,
  getName,
  getSetupLink,
  maskEmail,
  getErrorMessage,
  getType,
  isSupportedFactor,
  getIconUrl
};
