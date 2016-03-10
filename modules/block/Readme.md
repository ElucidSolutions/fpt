Block Module
============

```javascript
/*
*/
```

Handlers
--------

### Block Handlers

Block handlers may be either strings or functions.

#### Block Handler Strings 

Block Handler Strings must be URLs that reference HTML templates. When applied, the core module will load the referenced HTML template and replace the block element with the loaded HTML document.

#### Block Handler Functions

Block Handler Functions must accept four arguments:

* `context`, the block expansion context as a `block_Context`
* `success`, a function that accepts the expanded block element as a JQuery HTML Element
* `failure`, a function that does not accept any arguments
* and `expand`, a function that accepts two arguments: a child of `element` as JQuery HTML Element; and a function that does not accept any arguments  

The handler should perform some action and may either modify or replace `element`. It should pass the modified element to `success`. If it removes `element`, it should pass null or undefined to `success`. If an error occurs, it should throw a strict error and call `failure` instead of calling `success`.

Any function that creates a child element within `element` or modifies `element` should call `expand` to expand on the new element to expand any blocks that the child may contain along with any continuation.

### Page Handlers

Like other block handlers, page block handlers can be either functions or strings. 

#### Page Handler Strings

Page Handler Strings must be URLs that reference HTML templates. When applied, the core module will load the referenced HTML template and replace the Page Block element with the loaded HTML document.

#### Page Handler Functions

Page Handler Functions must accept three arguments:
 
* `id`, the current resource id 
* `success`, a function that accepts a JQuery HTML Element
* and `failure`, a function that does not accept any arguments.

The handler generates a page element that represents the resource referenced by `id` and passes the element to `success`. If an error occurs, the function should throw a strict error and call `failure` instead.

The Block Handler Store Class
-----------------------------

```javascript
/*
  Block Handler Stores store the registered
  block handlers and provide a safe interface
  for registering and retrieving them.
*/
function block_BlockHandlerStore () {
  var self = this;

  /*
    An associative array of Block Handlers keyed
    by HTML class name strings. 
  */
  var _handlers = {};

  /*
    Accepts one argument: 

    * className, an HTML class name string

    and returns the first Handler in handlers
    that is associated with className. If none of
    the handlers in handlers are associated
    with className, this function returns null
    instead.
  */
  this.get = function (className) {
    return _handlers [className];
  }

  /*
    Accepts two arguments:

    * className, a string that represents an
      HTML class name
    * and handler, a Handler;

    and adds handler to handlers under
    className. If another handler has already
    been added to handlers under className,
    this function throws a strictError instead.
  */
  this.add = function (className, handler) {
    if (_handlers [className]) {
      return strictError ('[block][block_HandlerStore] Error: an error occured while trying to register a block handler for "' + className + '". Another block handler has already been registered for "' + className + '"');
    }
    _handlers [className] = handler;
  }

  /*
    Accepts one argument:

    * handlers, an associative array of Block
      Handlers keyed by HTML class name strings

    and adds handlers to this._handlers. If
    any block handlers have already been added
    to this store under a class name listed
    in handlers, this function throws a strict
    error and skips the handler associated with
    the class name.
  */
  this.addHandlers = function (handlers) {
    for (var className in handlers) {
      self.add (className, handlers [className]);
    }
  }
}
```

The Block Handler Store
-----------------------

```javascript
/*
  A Handler Store that stores the registered
  block handlers.
*/
var block_BLOCK_HANDLERS = new block_HandlerStore ();
```

The Block Expansion Context Class
---------------------------------

```javascript
/*
  Accepts two arguments:

  * id, a string that represents a page ID
  * element, a JQuery Element that represents a block element

  and returns a Block Expansion Context.
*/
function block_Context (id, element) {
  this.getId = function ( return id; }
  this.element = element;
}
```

The Page Load Event Handler
---------------------------

Whenever Lucidity renders a page, this module iterates over the HTML elements contained within the page in inner-outer depth-first order.

When this module encounters an HTML element that has an HTML class, it checks to see whether or not there is a block handler in `block_BLOCK_HANDLERS`associated with the class.

If there is, this module calls the block handler and passes the element to it in a Block Expansion Context.

The block handler may or may not modify or remove the element.

When the block handler returns, this module continues iterating over the remaining elements.

The Module Load Event Handler
-----------------------------

```javascript
/*
*/
MODULE_LOAD_HANDLERS.add (
  function (done) {
    // I. Register the page load event handler.
    PAGE_LOAD_HANDLERS.push (
      function (done, pageId) {
        block_expandDocumentBlocks (pageId, done);
    });
});
```

Block Expansion 
---------------

```javascript
/*
  block_expandDocumentBlocks accepts two
  arguments:

  * defaultId, a Resource ID string
  * and done, a function that does not accept
    any arguments.

  block_expandDocumentBlocks expands the blocks
  contained within the current page and calls
  done. If the current URL does not include
  a resource ID, it sets the initial block
  expansion context's id to defaultId.
*/
function block_expandDocumentBlocks (defaultId, done) {
  var id = getIdFromURL (new URI ());
  block_expandBlock (new block_Context (id ? id : defaultId, $(document.body)), done);
}

/*
  block_expandBlock accepts two arguments:

  * context, a Block Expansion Context
  * and done, a function that does not accept
    any arguments.

  block_expandBlock recursively expands
  context.element and any blocks nested within
  context.element.

  If either context or context.element is undefined
  or null, block_expandBlock calls done.

  If context.element is a Page Block
  block_expandBlock calls block_expandPageBlock
  to expand context.element and then recurses
  over any blocks nested inside the expanded
  page element returned by block_expandPageBlock.

  If context.element is an Id Block
  block_expandBlock replaces it with
  context.getId ().

  If context.element is neither a Page nor an
  Id Block, it expands the blocks nested
  within context.element, finds a block handler
  that can be applied to context.element, and
  applies the handler to context.element, and
  recurses over the expanded element. 

  If none of the handlers can be applied to
  context.element, block_expandPageBlock simply
  calls done.

  If an error occurs, block_expandPageBlock
  calls done.

  Note: Block handlers must pass null or undefined
  to their continuations when they remove their
  block element.

  Note: Whenever a block handler replaces a block
  element, they must pass the replacement element
  to their successful continuations.

  Note: In rare circumstances, a block handler may
  intentionally prevent the block system from
  recursing into its expanded block element
  by intentionally passing null or undefined to
  its successful continuation. This should only be
  done when the expanded block element needs to be
  parsed by an external library.
*/
function block_expandBlock (context, done) {
  if (!context || !context.element) { return done (); }

  // I. Expand Page blocks.
  if (context.element.hasClass ('block_page_block')) {
    return block_expandPageBlock (context,
      function (pageContext) {
        block_expandBlock (pageContext, done);
      },
      done
    );
  }

  // II. Expand Id blocks.
  if (context.element.hasClass ('block_id_block')) {
    context.element.replaceWith (context.getId ());
    return done ();
  }

  // III. Expand normal blocks.

  // III.A. Expand sub-blocks.
  block_expandBlocks (context.getId (), context.element.children (),
    function () {
      // III.B. Expand the current block.

      var blockHandler = block_getHandler (block_BLOCK_HANDLERS, context.element);
      if (blockHandler) {
        // Remove the block handler's class.
        context.element.removeClass (blockHandler.name);

        // Apply the block handler.
        return block_applyBlockHandler (blockHandler.handler, context,
          function (expandedElement) {
            context.element = expandedElement;
            block_expandBlock (context, done);
          },
          done
        );
      }

      var pageHandler = getHandler (PAGE_HANDLERS, context.element);
      if (pageHandler) {
        // Remove the page handler's class.
        context.element.removeClass (pageHandler.name);

        // Apply the page handler.
        return applyPageBlockHandler (pageHandler.handler, context.element,
          function (expandedContext) {
            block_expandBlock (expandedContext, done);
          },
          done
        );
      }
      done ();
  });
}

/*
  block_expandBlocks accepts three arguments:

  * id, an Id string
  * elements, a JQuery HTML Element Set
  * and done, a function that does not accept any
    arguments.

  block_expandBlocks expands the blocks within
  elements and calls done.
*/
function block_expandBlocks (id, elements, done) {
  iter (
    function (element, next) {
      block_expandBlock (new block_Context (id, element), next);
    }, elements, done
  );
}

/*
  block_getHandler accepts two arguments:

  * handlers, a Handler Store
  * and element, a JQuery Element.

  block_getHandler returns the first handler
  in handlers that is associated with one of
  element's classes and returns the associated
  class in an associative array that has two
  properties:

  * handler, the handler
  * and name, the class name.

  If none of the handlers are associated
  with any of element's classes, this function
  returns null.
*/
function block_getHandler (handlers, element) {
  // I. Get the set of possible block names.
  var names = getClassNames (element);

  // II. Find the first handler in handlers associated with one of the names.
  for (var nameIndex = 0; nameIndex < names.length; nameIndex ++) {
    var name = names [nameIndex];
    var handler = handlers.get (name);
    if (handler) {
      return {handler: handler, name: name};
    }
  }

  // III. Return null if none of the handlers in handlers are associated with any of the names.
  return null;
}

/*
  block_applyBlockHandler accepts four arguments:

  * handler, a Block Handler
  * context, a Block Expansion Context
  * success, a function that accepts a JQuery
    HTML Element
  * and failure, a function that does not accept
    any arguments.

  block_applyBlockHandler applies handler to
  context.element and passes the result to done.
*/
function block_applyBlockHandler (handler, context, success, failure) {
  switch ($.type (handler)) {
    case 'function':
      return handler (context, success, failure,
        function (element, done) {
          block_expandBlock (new block_Context (context.getId (), element), done);
      });
    case 'string':
      return block_replaceWithTemplate (handler, context.element, success, failure);
    default:
      strictError ('[block][block_applyBlockHandler] Error: Invalid block handler. Block handlers must be either template URL strings or block handler functions.');
      return done ();
  }
}

/*
  block_expandPageBlock accepts three arguments:

  * context, a Block Expansion Context
  * success, a function that accepts a Block
    Expansion Context
  * and failure, a function that does not accept
    any arguments.

  context.element may contain a text node that
  represents a resource id.

  If context.element contains a text node,
  expandPageBlock interprets the text node as a
  resource id, finds the page handler associated
  with the given id, applies the page handler to
  the id, and passes the resulting page element
  to success in a Block Expansion Context.

  If context.element does not contain a text
  node, block_expandPageBlock uses the resource
  id given by context.getId ().

  If none of the page handlers can be applied to
  the resource id, or another error occurs,
  block_expandPageBlock throws a strict error 
  and calls failure instead of success.
*/
function block_expandPageBlock (context, success, failure) {
  // I. Get the current resource id.
  var id = context.element.text ();
  if (!id) {
    id = context.getId ();
  }

  // II. Get the resource page.
  getPage (id,
    function (page) {
      // III. Hide the page element.
      page.css ('opacity', 0);

      // IV. Replace the page block with the page element.
      context.element.replaceWith (page);

      // V. Expand any blocks contained within the page element.
      block_expandBlock (new block_Context (id, page),
        function () {
          // VI. Display the page element.
          page.animate ({opacity: 1}, 'fast');
 
          // VII. Pass the expanded page element to success.
          success (page);
      });
    },
    failure
  );
}

/*
  block_applyPageBlockHandler accepts four arguments:

  * handler, a Page Handler
  * element, a JQuery HTML Element
  * success, a function that accepts a Block
    Expansion Context
  * and failure, a function that does not accept
    any arguments.

  element must contain a single text node that
  represents a valid resource id.

  block_applyPageBlockHandler applies handler to the
  resource id contained within element and passes
  the resulting Block Expansion Context to success.

  If an error occurs, applyPageBlockHandler calls
  failure instead.
*/
function applyPageBlockHandler (handler, element, success, failure) {
  var id = element.text ();
  applyPageHandler (handler, id,
    function (page) {
      element.replaceWith (page);
      success ({id: id, element: page});
    },
    failure
  );
}
```

The Core Block Handlers
-----------------------

The Core module defines four block handlers:

* Core Page Block
The Core Page Block is defined implicitly by `expandBlock`. Core Page Blocks are used to generate pages using resource ids passed through URL query parameters. More details can be found in "Expand Blocks".

* Core Id Block
The Core Id Block is defined implicitly by `expandBlock`. `expandBlock` replaces Core Id Blocks with the current resource id. More details can be found in "Expand Blocks".

* Template Block
The Template Block handler is applied to any HTML div element that belongs to the "core_template_block" class. This element must contain a single text node - a URL string that references an HTML document. The handler loads the referenced document and replaces the block element with the loaded content. 

```javascript
/*
  block_templateBlock accepts three arguments:

  * blockElement, a JQuery HTML Element
  * success, a function that accepts a JQuery HTML
    Element
  * and failure, a function that does not accept any
    arguments.

  blockElement must contain a single text node that 
  represents an HTML document URL.

  block_templateBlock will load the referenced document, 
  replace blockElement with the loaded content, and
  passes the content to success. If an error occurs,
  it will call failure instead. 
*/
function block_templateBlock (blockElement, success, failure) {
  var templateURL = blockElement.text ();
  replaceWithTemplate (templateURL, blockElement, success, failure);
}
```

Block Auxiliary Functions
-------------------------

The remaining functions in core.js are auxiliary functions. The first set of helper functions are used by block handlers. `getBlockArguments` is used to parse block elements. `replaceWithTemplate` is called by `templateBlock` to replace block elements with loaded HTML templates. 

```javascript
/*
  getBlockArguments accepts four arguments: schema,
  an array of Block Schema objects; rootElement,
  a JQuery HTML Element; success, a function; and
  failure, another function.

  getBlockArguments finds the child elements of
  rootElement that have the argument class names
  given in schema, stores them in an associative
  array keyed by the names given in schema, and
  passes the resulting object to success.

  If any of the argument elements are listed as 
  required but none of the child elements have the
  given argument class name, this function throws a
  strict error and calls failure.
*/
function getBlockArguments (schema, rootElement, success, failure) {
  var elements = {};
  for (var i = 0; i < schema.length; i ++) {
    var scheme  = schema [i];
    var element = $('> .' + scheme.name, rootElement);
    if (element.length > 0) {
      elements [scheme.name] = scheme.text ? element.text () : element;
    } else if (scheme.required) {
      strictError ('[core][getBlockArguments] Error: an error occured while trying to get a required element. The "' + scheme.name + '" element is required.');
      return failure ();
    }
  }
  return success (elements);
}

/*
  getClassNames accepts a JQuery HTML Element,
  element, and returns a string array listing
  element's class names.
*/
function getClassNames (element) {
  var classNames = element.attr ('class');
  return classNames ? classNames.split (/\s+/) : [];
}
```
