function deleteFactor(factorid) {
  console.log(`deleteFactor ${factorid}`);
  // todo: make an ajax call?

  $.ajax({
    url: `/api/deleteFactor/${factorid}`,
    method: "POST",
  }).done(function(response) {
    console.log('success');
    
    window.location.reload();
  }).fail(function( jqXHR, textStatus ) {
    console.error('error');
  });      
}