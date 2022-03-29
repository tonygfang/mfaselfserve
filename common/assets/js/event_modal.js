$(document).ready(function () {

  $('.event-modal').modal({
    closable: false,
    centered: false  
  });  

  $('.event-modal.info').each(function(idx, elem) {
    console.log(`idx ${idx} elem ${elem}`);
    console.log(elem);
    
    let button_id = $(elem).attr('data-object');
    console.log(button_id);
    
    if ($('#' + button_id).length) {
      console.log('found ' + button_id);
      $(elem).modal('attach events', '#' + $(elem).attr('data-object'));
    }
  });


});

