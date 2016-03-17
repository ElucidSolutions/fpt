/*
  This module contains custom site-specific
  javascript that is called after all of the other
  block handlers have been executed.
*/

MODULE_LOAD_HANDLERS.add (
  function (done) {
  // I. Register the block handlers.
  block_HANDLERS.addHandlers ({
    'main_banner_block':        'templates/main_banner_block.html',
    'main_header_block':        'templates/main_header_block.html',
    'main_menu_block':          'templates/main_menu_block.html',
    'main_search_header_block': 'templates/main_search_header_block.html',
    'main_search_menu_block':   'templates/main_search_menu_block.html',
    'main_start_presentation_block': main_startPresentationBlock
  });

  // II. Display/hide the Back to Top tab.
  setInterval (main_displayBackToTop, 1000);

  // III. Set the Back to Top tab's click event handler.
  $('#back_to_top').click (
    function (event) {
      event.preventDefault ();
      $('html, body').animate ({
        scrollTop: $('#top').offset ().top
      });
  });

  // IV. Set the Sidr Fadeout handler.
  setInterval (
    function () {
      var status = $.sidr ('status');
      if ((!status.moving && status.opened) || (status.moving && !status.opened)) {
        main_darken ();
      } else {
        main_undarken ();
      }
    },
    200
  );

  // V. Close the menu on page load.
  PAGE_LOAD_HANDLERS.add (
    function (done) {
      $.sidr ('close');
      done (null);
  });

  done (null);
});

// This function hides/displays the Back to Top tab.
function main_displayBackToTop () {
  if ($(window).scrollTop() > 200) {
    $('#back_to_top').animate ({opacity: 1});
  } else {
    $('#back_to_top').animate ({opacity: 0});
  }
}

// Darken the body element.
function main_darken () {
  if ($('#dark_overlay').length == 0) {
    $('#body').prepend (
      $('<div></div>')
        .attr ('id', 'dark_overlay')
        .css ({
           'background-color': 'black',
           'display':          'none',
           'height':           '100%',
           'position':         'fixed',
           'top':              '0px',
           'width':            '100%',
           'z-index':          '30000'
         })
        .fadeTo (250, '0.5'))
        .click (function (event) {
          $.sidr ('close');
        });
  }
}

// Undarken the body element.
function main_undarken () {
  $('#dark_overlay').fadeOut (250,
    function () {
      $(this).remove ();
  });
}

/*
*/
function main_startPresentationBlock (context, done) {
  var element = $('<p>Play the Getting Started Tab</p>');

  presentation_SLIDE_ELEMENTS.get (context.element.text (),
    function (slideElement) {
      var intro = slideElement.getIntro ()
        .onchange (
          function () { 
            element.html ('<p>Stop the Getting Started Tab</p>');
        })
        .oncomplete (
          function () {
            element.html ('<p>Replay the Getting Started Tab</p>');
        })
        .onexit (
          function () {
            element.html ('<p>Replay the Getting Started Tab</p>');
        });
         
      element.click (
        function () {
          if (intro.running) {
            intro.exit ();
            // There is a bug in the IntroJS library in which the onexit callback is not called when intro.exit is called directly.
            element.html ('<p>Replay the Getting Started Tab</p>');
          } else {
            intro.start ();
          }
      });
  });

  context.element.replaceWith (element);
  done (null, element);
}
