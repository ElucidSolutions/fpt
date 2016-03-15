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

    // II. Continue.
    done ();
});

/*
  Note: page_block does not load the page
  referenced by the current context. Instead it
  registers a page load handler that replaces the
  block element when a page load event occurs.
*/
function page_block (context, success, failure) {
  var element = context.element;
  PAGE_LOAD_HANDLERS.add (
    function (next, id) {
      page_getPageElement (id,
        function (newElement) {
          element.replaceWith (newElement);
          element = newElement;
          block_expandBlock (
            new block_Context (id, newElement),
            function () {}
          );
        },
        next
      );
  });
  success ();
}

/*
  page_getPageElement accepts three arguments:

  * id, a Resource ID string
  * success, a function that accepts a JQuery
    HTML Element
  * and failure, a function that does not accept
    any arguments.

  page_getPageElement passess success the page
  of the resource referenced by id without
  expanding any blocks that may be embedded
  within it.

  If an error occurs, page_getPageElement calls
  failure instead of success.

  Note: we can not expand the blocks contained
  within an element while it is detached. Doing
  so causes certain libraries (such as the
  bxslider and sidr libraries) to fail.
*/
function page_getPageElement (id, success, failure) {
  var type = getContentType (id);
  var handler = page_HANDLERS.get (type);
  if (!handler) {
    return failure ();
  }
  page_applyPageHandler (handler, id, success, failure);
}

/*
  page_applyPageHandler accepts four arguments:

  * handler, a Page Handler
  * id, a resource id
  * success, a function that accepts a JQuery
    HTML Element.
  * and failure, a function that does not accept
    any arguments.

  page_applyPageHandler applies handler to id and
  passes the returned element to success.

  If an error occurs, page_applyPageHandler calls
  throws a strict error and calls failure. 
*/
function page_applyPageHandler (handler, id, success, failure) {
  switch ($.type (handler)) {
    case 'function':
      return handler (id, success, failure);
    case 'string':
      return getTemplate (handler, success, failure);
    default:
      strictError ('[page][page_applyPageHandler] Error: invalid page template type. Page templates must be either a string or a function.'); 
      return failure ();
  }
}