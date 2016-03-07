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
  // loadScript ('modules/sidr/lib/sidr/jquery.sidr.min.js',
  loadScript ('modules/sidr/lib/sidr-2.2.1/dist/jquery.sidr.js',
    function () {
      // II. Load CSS files.
      // $.getCSS ('modules/sidr/sidr.css');

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
    displace: true,
    speed: 300
  });
  done ();
}
