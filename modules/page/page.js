/*
*/
function page_HandlerStore () {
  var self = this;

  /*
  */
  var _handlers = {};

  /*
  */
  this.get = function (type) {
    return _handlers [type];
  }

  /*
  */
  this.add = function (type, handler) {
    _handlers [type] = handler;
  }

  /*
  */
  this.addHandlers = function (handlers) {
    for (var type in handlers) {
      self.add (type, handlers [type]);
    } 
  }
}

/*
*/
var page_HANDLERS = new page_HandlerStore ();

/*
*/
MODULE_LOAD_HANDLERS.add (
  function (done) {
    // I. Register the block handlers.
    block_HANDLERS.add ('page_block', page_block);

    // II. Register the page load event handler.
    PAGE_LOAD_HANDLERS.add (
      function (id, done) {
        block_expandDocumentBlocks (id, done);
    });

    // III. Continue.
    done (null);
});

/*
  Note: page_block does not load the page
  referenced by the current context. Instead it
  registers a page load handler that replaces the
  block element when a page load event occurs.
*/
function page_block (context, done) {
  var element = context.element;
  PAGE_LOAD_HANDLERS.add (
    function (id, next) {
      page_getPageElement (id,
        function (error, newElement) {
          if (error || !newElement) {
            error = new Error (error.message + '[page][page_block] Error: an error occured while trying to load a page block.');
            strictError (error);
            return next (error);
          }

          element.replaceWith (newElement);
          element = newElement;
          block_expandBlock (
            new block_Context (id, newElement),
            next
          );
      });
  });
  done (null);
}

/*
  page_getPageElement accepts three arguments:

  * id, a Resource ID string
  * done, a function that accepts two arguments:
    an Error object and a JQuery HTML Element

  page_getPageElement passess done the page
  of the resource referenced by id without
  expanding any blocks that may be embedded
  within it.

  If none of the page handlers can handle the
  give ID, page_getPageElement passes null
  to done.

  If an error occurs, page_getPageElement passes 
  the error to done.
*/
function page_getPageElement (id, done) {
  var type = getContentType (id);
  var handler = page_HANDLERS.get (type);
  if (!handler) {
    return done (null, null);
  }
  page_applyPageHandler (handler, id, done);
}

/*
  page_applyPageHandler accepts four arguments:

  * handler, a Page Handler
  * id, a resource id
  * done, a function that accepts two arguments:
    an Error object and a JQuery HTML Element.

  page_applyPageHandler applies handler to id and
  passes the returned element to done.

  If an error occurs, page_applyPageHandler
  throws a strict error and passes the error
  to done.
*/
function page_applyPageHandler (handler, id, done) {
  switch ($.type (handler)) {
    case 'function':
      return handler (id, done);
    case 'string':
      return getTemplate (handler, done);
    default:
      var error = new Error ('[page][page_applyPageHandler] Error: invalid page template type. Page templates must be either a string or a function.'); 
      strictError (error);
      done (error);
  }
}