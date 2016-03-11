/*
  The module load event handler. This function
  registers the module's block and page handlers.
*/
MODULE_LOAD_HANDLERS.add (
  function (done) {
    // I. Register the block handler.
    block_HANDLERS.add ('example_block', 'modules/example/templates/block.html');

    // II. Register the page handler.
    template_TEMPLATES.add ('example_page', 'modules/example/templates/page.html');

    done ();
});