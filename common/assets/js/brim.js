$(document).ready(function () {
  $("#brim_links").hide();
});

  
function generateBrimLinks() {
  console.log('generateBrimLinks');
  let brimBaseUrl = 'https://cwbuat.brim.ca/webportal/sso/init';
  let cardId = $("#card_id").val();
  
  console.log(`cardId: ${cardId}`);
  
  // device_secret and id_token are defined in brim.mustache
  console.log(`device_secret: ${device_secret}`);
  console.log(`id_token: ${id_token}`);
  
  // https://cwbuat.brim.ca/webportal/sso/init/{card_id}?device_secret={non_encrypted_device_secret}&id_token={non_encrypted_id_token}
  let brimNativeSSOUrl = `${brimBaseUrl}/${cardId}?device_secret=${device_secret}&id_token=${id_token}`;
  let brimNativeSSOText = `Click here for Native SSO to BRIM card_id ${cardId}`;
  console.log(`brimNativeSSOUrl: ${brimNativeSSOUrl}`);

  let brimSessionSSOUrl = `${brimBaseUrl}/${cardId}`;
  let brimSessionSSOText = `Click here for Session-based SSO to BRIM card_id ${cardId}`;
  console.log(`brimSessionSSOUrl: ${brimSessionSSOUrl}`);
  
  $('#brim_native_sso').prop('href', brimNativeSSOUrl);
  $('#brim_native_sso').prop('text', brimNativeSSOText);

  $('#brim_session_sso').prop('href', brimSessionSSOUrl);
  $('#brim_session_sso').prop('text', brimSessionSSOText);
  
  $("#brim_links").show();
}