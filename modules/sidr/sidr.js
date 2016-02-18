/*
  This module is a simple wrapper for the Sidr
  library (http://www.berriart.com/sidr). The Sidr
  library behaves similar to a block module in that
  it expands any HTML Div element named "sidr" into
  a floating menu panel.

  This module simply loads the library and its CSS
  files.

  There are several ways to create a sidr panel.
  The simplest way is to create a link element, l,
  whose href attribute points to a div element that
  contains a list and call "l.sidr ()" on the link
  element. Sidr will then toggle the referenced
  div element as a side panel whenever l is clicked
  on.
*/

/*
  sidr_load is the load event handler for this
  module.
*/
registerModule (
  function (done) {
  // I. Load libraries.
  loadScript ('modules/sidr/lib/sidr/jquery.sidr.min.js',
    function () {
      // II. Load CSS files.
      $.getCSS ('modules/sidr/sidr.css');

      // III. Register the block handlers.
      registerBlockHandler ('sidr_block', sidr_block);

      done ();
  });
});

/*
  sidr_block accepts two arguments:

  * blockElement, a JQuery HTML Element
  * done, a function.

  blockElement must be a link element that is
  linked to an HTML div element that contains a
  list. 

  sidr_block modifies blockElement so that when
  clicked, the div element referenced by
  blockElement will appear/disappear as a side
  panel. sidr_block then calls done.
*/
function sidr_block (blockElement, done) {
  blockElement.sidr ({
    displace: false,
    speed: 300
  });

  /*
    If the blockElement is being recreated,
    the sidrOpened state variable may be
    invalid. Sidr only allows one menu to be open
    at a time. This state variable indicates which
    menu is currently open. If the menu element
    associated with the blockElement was removed
    while it was open, this state variable will
    no longer be valid as it will indicate that
    the element is open. The result is that any
    attempts to open or close the menu will fail
    as the sidrOpened variable and the visibility
    state will disagree. This snippet, corrects
    the invalid state variable and opens the menu
    if it was open when it was removed.

    Note: the sidrOpened variable is not a
    global variable by default. In order for
    this variable to be accessible, you must
    first patch the Sidr library.
  */
  if (sidrOpened) {
    sidrOpened = false;
    $.sidr ('open');
  }
  done ();
}
