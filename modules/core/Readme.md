Core Module
===========

The Core module is responsible for loading secondary modules and libraries and for defining the block and page handling systems.

The Core module is defined by core.js. The introduction to this file reads:

```javascript
/*
  The Core module defines the module, block, and page
  handling systems.
*/
```

### QUnit Module Declaration

Every module should define a separate QUnit module to group its unit tests under. The following line defines a QUnit module named core to group the module's unit tests.
 
```javascript
QUnit.module ('core');
```

### Global Variables

The Core module defines a number of global variables. These variables can be divided into two groups: those that specify global configuration parameters and those that list registered block and page handlers. 

The Core module defines two global configuration parameters:

* `SETTINGS_URL`

  `SETTINGS_URL` specifies the location of the Configuration Settings file.

* `STRICT_ERROR_MODE`

  `STRICT_ERROR_MODE` indicates whether or not Lucidity should try to recover gracefully from errors or report them immediately. This parameter is set by the `errorMode` element in the Configuration Settings file. 

The remaining global variables store the registered block and page handlers. Whenever a module defines a block or page handler, the module's load event handler must register the block or page handler by calling `registerBlockHandler` or `registerPageHandler` respectively. These functions add entries to `BLOCK_HANDLERS` and `PAGE_HANDLERS`.

Both variables are associative arrays keyed by name. See "Page Handlers" and "Block Handlers" below for more details about page and block handlers.

```javascript
// Specifies the settings file URL. 
var SETTINGS_URL = 'settings.xml';

/*
  The global STRICT_ERROR_MODE variable indicates
  whether or not the system should exit and return
  an error message or try to recover silently from
  non-critical errors. This variable is set by the
  "errorMode" parameter in settings.xml.
*/
var STRICT_ERROR_MODE = true;

/*
  The global BLOCK_HANDLERS array lists the active
  block handlers that have been registered with the
  system. Every module, when loaded, must call
  registerBlockHandler to add its block handlers to
  this array.
*/
var BLOCK_HANDLERS = {};

/*
  The global PAGE_HANDLERS array lists the page
  handlers that have been registered with the
  system keyed by page type. Every module, when
  loaded, must call registerPageHandler to add
  its page handlers to this array.
*/
var PAGE_HANDLERS = {};

/*
  The global PAGE_LOAD_HANDLERS array lists
  the Page Load event handlers that have been
  registered with the system. Whenever the
  loadPage function is executed, the functions
  listed within this array are called and passed
  the new page's ID.
*/
var PAGE_LOAD_HANDLERS = [];

/*
*/
var MODULES = [];

/*
*/
var currentId = 0;
```

### The Load Event Handler

The Core module's load event handler runs when the site is loaded. This function performs five operations:

1. it loads the configuration settings specified in settings.xml
2. it loads the modules listed as enabled in settings.xml
3. it registers the core block handlers
4. and lastly, it recursively expands any blocks contained within the page.

```javascript
/*
  The Document Ready event handler. This function
  loads the modules that have been enabled in
  settings.xml and initializes the user interface
  by expanding any blocks that have been embedded
  within the current page.
*/
$(document).ready (function () {
  // I. Load the configuration settings.
  loadSettings (function (settings) {
    STRICT_ERROR_MODE = settings.errorMode;

    // II. Load the enabled modules.
    loadModules (settings, function () {

      // III. Register the core block handlers.
      registerBlockHandlers ({
        core_link_block:     linkBlock,
        core_template_block: templateBlock
      });

      // IV. Expand any block elements. 
      expandDocumentBlocks (settings.defaultId,
        function () {
          // V. Fadeout the overlay element.
          $('#overlay').fadeOut ('slow',
            function () {
              $(this).remove ();
          });
      });
    });
  });
});
```

### The Hash Change Event Handler

The Core module defines a Hash Change event handler. Whenever the browser URL hash changes, this event handler loads the resource referenced by the URL. 

```javascript
/*
  This function will load the referenced page
  if the browser URL hash changes.
*/
$(window).on ('hashchange', function () {
  // I. Get the resource ID.
  var id = new URI ().fragment ();

  var handler = getPageHandler (id);
  if (handler) {
    // II. Get the referenced resource page.
    applyPageHandler (handler, id,
      function (page) {
        // III. Hide the page block.
        page.css ('opacity', 0);

        // IV. Attach the page element.
        $('#main_content').empty ().append (page);

        // V. Expand any blocks contained within the page element.
        expandBlock ({id: id, element: page},
          function () {
            // VI. Call the Page Load event handlers.
            seq (PAGE_LOAD_HANDLERS,
              function () {
                // VII. Display the page element.
                page.animate ({opacity: 1}, 'fast');

                // VIII. Scroll to the top of the page.
                $('html, body').animate ({scrollTop: '0px'});
              },
              id
            );
        });
      },
      function () {
        strictError ('[core] Error: an error occured while trying to load page "' + id + '".');
    });
  }
});
```

### Load Settings

The load event handler uses `loadSettings` to load and parse settings.xml, and return the configuration settings.

```javascript
/*
  loadSettings accepts one argument: done, a 
  function that accepts a Settings object. It 
  parses the settings.xml file and passes the 
  result to done.
*/
function loadSettings (done) {
  $.ajax (SETTINGS_URL, {
    dataType: 'xml',
    success: function (doc) {
      done (parseSettings (doc));
    },
    error: function (request, status, error) {
      throw new Error ('[core.js][loadSettings] Critical Error: an error occured while trying to load "settings.xml". ' + error);
    }
  });
}

/*
  parseSettings accepts one argument: doc, a JQuery
  HTML DOM Document. doc must represent a valid
  Settings document. This function parses doc and
  returns a Settings object that represents it.  
*/
function parseSettings (doc) {
  return {
    errorMode: $('errorMode', doc).text () === 'strict',
    defaultId: $('defaultId', doc).text (),
    theme:     $('theme', doc).text (),
    modules:   $('module', doc).map (function (moduleIndex, moduleElement) {
      return {
        name:    $(moduleElement).attr ('name'),
        enabled: $(moduleElement).attr ('enabled') === 'true',
        url:     $(moduleElement).attr ('url')
      };
    }).toArray ()
  };
}
```

### Register Modules

```javascript
/*
*/
function registerModule (module) {
  MODULES.push (module);
}
```

### Load Modules

Once the configuration settings have been loaded from settings.xml, the load event handler uses `loadModules` to load the modules that have been listed as enabled within settings.xml.

```javascript
/*
  loadModules accepts two arguments: settings, a
  Settings object; and done, a function. It
  loads the modules declared in settings, and 
  calls done after they have all been loaded If
  an error occurs while trying to load one of the
  modules, this function will throw a strict error
  and continue on to the next one.
*/
function loadModules (settings, done) {
  // I. Add the main module to the modules list.
  settings.modules.push ({
    name:    'main',
    enabled: true,
    url:     'index.js'
  });

  // II. Load the module files in the modules list.
  _loadModules (0, settings.modules, 
    function () {
      // III. Execute the module load functions.
      seq (MODULES, done);
  });
}

/*
  _loadModules accepts three arguments: moduleIndex,
  a number; modules, an array of Module
  Declarations; and done, a function. _loadModules
  skips over the first moduleIndex declarations in
  modules, loads the remaining modules, and calls
  done. If an error occurs while trying to load 
  one of the modules, this function will throw a
  strict error and continue on to the next one.
*/
function _loadModules (moduleIndex, modules, done) {
  if (moduleIndex >= modules.length) {
    return done ();
  }

  var module = modules [moduleIndex];

  var next = function () {
    _loadModules (moduleIndex + 1, modules, done);
  };

  module.enabled ? 
    loadScript (module.url, next) :
    next ();
}

/*
  loadScript accepts two arguments: url, a string;
  and done, a function. It loads the script 
  referenced by url and calls done. If an error 
  occurs, this function throws a strict error and
  calls done.
*/
function loadScript (url, done) {
  $.getScript (url)
    .done (done)
    .fail (function (jqxhr, settings, exception) {
        strictError ('[core.js][loadScript] Error: an error occured while trying to load "' + url + '".');
        return done ();
      });
}
```

### Blocks

Blocks are HTML elements that, when processed, trigger certain actions. These actions may replace or modify the element and are performed by **Block Handlers**.

When a block element has been processed by a block handler, we say that it has been "expanded".

Every block handler is associated with an HTML class name. Block elements specify which block handler should be applied to them by including the handler's HTML class.

Blocks may contain child elements or text nodes. These child elements and text nodes may represent arguments required by the block's handler.

Blocks are expanded in depth-first inner-outer order. This allows blocks to be nested inside each other so that the output of one block handler can be passed to another.

Block handlers may be either strings or functions.

#### Block Handler Strings 

Block Handler Strings must be URLs that reference HTML templates. When applied, the core module will load the referenced HTML template and replace the block element with the loaded HTML document.

#### Block Handler Functions

Block Handler Functions must accept four arguments:

* `element`, the block element as a JQuery HTML Element
* `success`, a function that accepts the expanded block element as a JQuery HTML Element
* `failure`, a function that does not accept any arguments
* and `expand`, a function that accepts two arguments: a child of `element` as JQuery HTML Element; and a function that does not accept any arguments  

The handler should perform some action and may either modify or replace `element`. It should pass the modified element to `success`. If it removes `element`, it should pass null or undefined to `success`. If an error occurs, it should throw a strict error and call `failure` instead of calling `success`.

Any function that creates a child element within `element` or modifies `element` should call `expand` to expand on the new element to expand any blocks that the child may contain along with any continuation.

### Register Block Handlers

Block handlers must be registered using `registerBlockHandler`.

```javascript
/*
  registerBlockHandlers accepts an associative
  array of block handlers keyed by name and
  registers them.
*/
function registerBlockHandlers (handlers) {
  for (var name in handlers) {
    registerBlockHandler (name, handlers [name]);
  }
}

/*
  registerBlockHandler accepts two arguments:

  * name, a string
  * and handler, a Block Handler.

  registerBlockHandler adds handler to the list of
  block handlers under name.

  If another handler has already been registered
  under name, this function throws a strict error.
*/
function registerBlockHandler (name, handler) {
  var errorMessagePrefix = '[core][registerBlockHandler] Error: an error occured while trying to register a new block handler under "' + name + '".';

  if (BLOCK_HANDLERS [name]) {
    return strictError (errorMessagePrefix + ' Another block handler is already registered under the same name.');
  }
  if (PAGE_HANDLERS [name]) {
    return strictError (errorMessagePrefix + ' A page block handler has already been registered under the same name.');
  }
  BLOCK_HANDLERS [name] = handler;
}
```

### Expand Blocks

Once the load event handler has finished loading modules, it calls `expandDocumentBlocks` to expand any blocks contained within the page.

```javascript
/*
  expandDocumentBlocks accepts two arguments:

  * defaultId, a Resource ID string
  * and done, a function that does not accept
    any arguments.

  expandDocumentBlocks expands the blocks
  contained within the current page and calls
  done. If the current URL does not include
  a resource ID, it sets the initial block
  expansion context's id to defaultId.
*/
function expandDocumentBlocks (defaultId, done) {
  var id = getIdFromURL (new URI ());
  if (!id) {
    id = defaultId;
  }
  expandBlock ({
      id:      id,
      element: $(document.body)
    },
    done
  );
}
```

In turn, `expandDocumentBlocks` calls `expandBlock`. `expandBlock` recursively expands the blocks contained within the current page.

`expandBlock` is the most important function in the block system. It accepts two arguments:

* `context`, a Block Expansion Context
* and `done`, a function that accepts an HTML element.

**Block Expansion Contexts** are objects that contain two properties:

* `id`, an Id string
* and `element`, a JQuery HTML Element.

Every page may represent a resource and this resource's id is stored in `context.id`.

`expandBlock` recursively expands `context.element` and implicitly defines the Core Page and Core Id Blocks.

```javascript
/*
  expandBlock accepts two arguments:

  * context, a Block Expansion Context
  * and done, a function that does not accept
    any arguments.

  expandBlock recursively expands context.element
  and any blocks nested within context.element.

  If either context or context.element is undefined
  or null, expandBlock calls done.

  If context.element is a Core Page Block
  expandBlock calls expandPageBlock to expand
  context.element and then recurses over any blocks
  nested inside the expanded page element returned
  by expandPageBlock.

  If context.element is a Core Id Block expandBlock
  replaces it with context.id.

  If context.element is neither a Core Page or a
  Core Id Block, it expands the blocks nested
  within context.element, finds a block handler
  that can be applied to context.element, and
  applies the handler to context.element, and
  recurses over the expanded element. 

  If none of the handlers can be applied to
  context.element, expandPageBlock simply calls done.

  If an error occurs, expandPageBlock calls done.

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
function expandBlock (context, done) {
  if (!context || !context.element) { return done (); }

  // I. Expand Core Page blocks.
  if (context.element.hasClass ('core_page_block')) {
    return expandPageBlock (context,
      function (pageContext) {
        expandBlock (pageContext, done);
      },
      done
    );
  }

  // II. Expand Core Id blocks.
  if (context.element.hasClass ('core_id_block')) {
    context.element.replaceWith (context.id);
    return done ();
  }

  // III. Expand normal blocks.

  // III.A. Expand sub-blocks.
  expandBlocks (context.id, context.element.children (),
    function () {
      // III.B. Expand the current block.

      var blockHandler = getHandler (BLOCK_HANDLERS, context.element);
      if (blockHandler) {
        // Remove the block handler's class.
        context.element.removeClass (blockHandler.name);

        // Apply the block handler.
        return applyBlockHandler (blockHandler.handler, context,
          function (expandedElement) {
            context.element = expandedElement;
            expandBlock (context, done);
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
            expandBlock (expandedContext, done);
          },
          done
        );
      }
      done ();
  });
}

/*
  expandBlocks accepts three arguments:

  * id, an Id string
  * elements, a JQuery HTML Element Set
  * and done, a function that does not accept any
    arguments.

  expandBlocks expands the blocks within elements
  and calls done.
*/
function expandBlocks (id, elements, done) {
  _expandBlocks (0, id, elements, done);
}

/*
  _expandBlocks accepts four arguments:

  * elementIndex, a positive integer
  * id, an Id string
  * elements, JQuery HTML Element Set
  * and done, a function that does not accept any
    arguments.

  _expandBlocks starts at elementIndex and
  iterates over the remaining elements in elements
  expanding any blocks contained within each. Once
  done, _expandBlocks calls done.
*/
function _expandBlocks (elementIndex, id, elements, done) {
  // I. Call done when all of the elements have been expanded.
  if (elementIndex >= elements.length) {
    return done ();
  }
  // II. Expand the current element.
  expandBlock ({
      id:      id,
      element: elements.eq (elementIndex)
    },
    function () {
      // III. Expand the remaining elements.
      _expandBlocks (elementIndex + 1, id, elements, done);
  });
}

/*
  getHandler accepts two arguments:

  * handlers, an associative array of Handlers
  * and element, a JQuery Element.

  getHandler returns the first handler in
  handlers that is associated with one of
  element's classes and the associated class in
  an associative array that has two properties: 

  * handler, the handler
  * and name, the class name.

  If none of the handlers are associated
  with any of element's classes, this function
  returns null.
*/
function getHandler (handlers, element) {
  // I. Get the set of possible block names.
  var names = getClassNames (element);

  // II. Find the first handler in handlers associated with one of the names.
  for (var nameIndex = 0; nameIndex < names.length; nameIndex ++) {
    var name = names [nameIndex];
    var handler = handlers [name];
    if (handler) {
      return {handler: handler, name: name};
    }
  }

  // III. Return null if none of the handlers in handlers are associated with any of the names.
  return null;
}

/*
  applyBlockHandler accepts four arguments:
  
  * handler, a Block Handler
  * context, a Block Expansion Context
  * success, a function that accepts a JQuery
    HTML Element
  * and failure, a function that does not accept
    any arguments.

  applyBlockHandler applies handler to
  context.element and passes the result to done.
*/
function applyBlockHandler (handler, context, success, failure) {
  switch ($.type (handler)) {
    case 'function':
      return handler (context.element, success, failure,
        function (element, done) {
          var elementContext = {
            id:      context.id,
            element: element
          };
          expandBlock (elementContext, done);
      });
    case 'string':
      return replaceWithTemplate (handler, context.element, success, failure);
    default:
      strictError ('[core][applyBlockHandler] Error: Invalid block handler. Block handlers must be either template URL strings or block handler functions.');
      return done ();
  }
}
```

### Page Handlers

Pages are generated by expanding two types of blocks, Core Page Blocks and **Page Blocks**.

The handlers that expand page blocks are called **Page Block Handlers**.

Page block handler functions accept a resource id and return a page element that represents the referenced resource. This element is used to replace the page block that the handler was applied to.

Like other block handlers, every page block handler is associated with a class name. A page block is a block that belongs to a class associated with a page block handler and that contains a text node representing a resource id.

Page block handler functions are applied to page blocks like any other block handler function, but instead of being passed the block element they are passed the resource id contained within it.  

Like other block handlers, page block handlers can be either functions or strings. 

#### Page Handler Strings

Page Handler Strings must be URLs that reference HTML templates. When applied, the core module will load the referenced HTML template and replace the Page Block element with the loaded HTML document.

#### Page Handler Functions

Page Handler Functions must accept three arguments:
 
* `id`, the current resource id 
* `success`, a function that accepts a JQuery HTML Element
* and `failure`, a function that does not accept any arguments.

The handler generates a page element that represents the resource referenced by `id` and passes the element to `success`. If an error occurs, the function should throw a strict error and call `failure` instead.

### Register Page Handlers

Page handlers must be registered with the system before they can be applied. `registerPageHandler` should be used to register page handers. 

```javascript
/*
  registerPageHandlers accepts an associative array
  of Page Handlers keyed by name and registers them.
*/
function registerPageHandlers (handlers) {
  for (var name in handlers) {
    registerPageHandler (name, handlers [name]);
  }
}

/*
  registerPageHandler accepts two arguments:

  * name, a string
  * and handler, a Page Handler

  registerPageHandler adds handler to the list of
  page handlers under name and adds handler's page
  block handler to the list of block handlers under
  name.

  If another page or block handler has already been
  registered under name, registerPageHandler throws
  a strict error.
*/
function registerPageHandler (name, handler) {
  var errorMessagePrefix = '[core][registerPageHandler] Error: an error occured while trying to register a new page handler under "' + name + '".';

  if (PAGE_HANDLERS [name]) {
    return strictError (errorMessagePrefix + ' Another page handler has already been registered for the same page type.');
  }
  if (BLOCK_HANDLERS [name]) {
    return strictError (errorMessagePrefix + ' Another block handler has already been registered under the same name.');
  }
  PAGE_HANDLERS [name] = handler;
}
```

### Apply Page Handler

When `expandBlock` encounters a Core Page Block, it calls `expandPageBlock` to expand the block element. This function finds the page handler that is associated with the current resource id and replaces the element with a page element that represents the referenced resource.

Core Page Blocks are block elements belonging to the "core_page_block" class. Every Core Page Block should contain a text node representing a resource id.

Core Page Blocks are expanded by `expandPageBlock`. This function checks to see whether or not the current page URL contains a query parameter named `id`. If it does, this query parameter's value must be a valid resource id. `expandPageBlock` finds the first page block handler associated with the id, applies the handler, and replaces the page block with the page element returned by the handler.

If the URL does not include a query parameter named id, `expandPageBlock` finds the first page block handler associated with the id contained within the page block, applies the handler, and replaces the page block with the page element returned by the handler instead.

```javascript
/*
  expandPageBlock accepts three arguments:

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
  node, expandPageBlock uses the resource id given
  by context.id.

  If none of the page handlers can be applied to
  the resource id, or another error occurs,
  expandPageBlock throws a strict error and calls failure
  instead of success.
*/
function expandPageBlock (context, success, failure) {
  // I. Get the current resource id.
  var id = context.element.text ();
  if (!id) {
    id = context.id;
  }

  // II. Get the resource page.
  getPage (id,
    function (page) {
      // III. Hide the page element.
      page.css ('opacity', 0);

      // IV. Replace the page block with the page element.
      context.element.replaceWith (page);

      // V. Expand any blocks contained within the page element.
      expandBlock ({id: id, element: page},
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
  loadPage accepts three arguments:

  * id, a Resource ID string

  loadPage replaces the Main Content element
  with the resource referenced by id.
*/
function loadPage (id, success, failure) {
  // I. Load the referenced page.
  // Note: The hashchange event handler is
  // responsible for actually loading the page
  // at this point.
  document.location.href = getContentURL (id);
}

/*
  getPage accepts three arguments:

  * id, a Resource ID string
  * success, a function that accepts a JQuery
    HTML Element
  * and failure, a function that does not accept
    any arguments.

  getPage passess success the page of the
  resource referenced by id without expanding
  any blocks that may be embedded within it.

  If an error occurs, getPage calls failure
  instead of success.

  Note: we can not expand the blocks contained
  within an element while it is detached. Doing
  so causes certain libraries (such as the
  bxslider and sidr libraries) to fail.
*/
function getPage (id, success, failure) {
  // I. Get the first page handler that can be applied to the resource id.
  var handler = getPageHandler (id);
  if (!handler) {
    strictError ('[core][getPage] Error: none of the registered page handlers can be applied to "' + id + '".');
    return failure ();
  }

  // II. Apply the page handler to the resource id.
  applyPageHandler (handler, id,
    function (element) {
      // III. Pass the resulting page to success as a Block Expansion Context.
      success (element);
    },
    failure
  );
}

/*
  getPageHandler accepts a string that represents
  a page id and returns the page handler that has
  been registered to handle the id. 
*/
function getPageHandler (id) {
  var type = getContentType (id);
  if (!type) {
    return null;
  }
  var handler = PAGE_HANDLERS [type];
  if (!handler) {
    return null;
  }
  return handler;
}

/*
  applyPageBlockHandler accepts four arguments:
 
  * handler, a Page Handler
  * element, a JQuery HTML Element
  * success, a function that accepts a Block
    Expansion Context
  * and failure, a function that does not accept
    any arguments.

  element must contain a single text node that
  represents a valid resource id.

  The page block handler applies handler to the
  referenced id and element and passes id and
  the HTML element returned by handler to
  success in a Block Expansion Context.

  applyPageBlockHandler applies handler to the
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

/*
  applyPageHandler accepts four arguments:

  * handler, a Page Handler
  * id, a resource id
  * success, a function that accepts a JQuery
    HTML Element.
  * and failure, a function that does not accept
    any arguments.

  applyPageHandler applies handler to id and
  passes the returned element to success.

  If an error occurs, applyPageHandler calls throws
  a strict error and calls failure. 
*/
function applyPageHandler (handler, id, success, failure) {
  switch ($.type (handler)) {
    case 'function':
      return handler (id, success, failure);
    case 'string':
      return getTemplate (handler, success, failure);
    default:
      strictError ('[core][applyPageHandler] Error: invalid page template type. Page templates must be either a string or a function.'); 
      return failure ();
  }
}
```

### The Core Block Handlers

The Core module defines four block handlers:

* Core Page Block
The Core Page Block is defined implicitly by `expandBlock`. Core Page Blocks are used to generate pages using resource ids passed through URL query parameters. More details can be found in "Expand Blocks".

* Core Id Block
The Core Id Block is defined implicitly by `expandBlock`. `expandBlock` replaces Core Id Blocks with the current resource id. More details can be found in "Expand Blocks".

* Link Block
The Link Block handler is applied to any HTML element that belongs to the "core_link_block" class. The element must be an HTML link element and reference an internal resource. When expanded, the Link Block handler will add a click event handler to the link that replaces the Main Content element with the referenced resource whenever the link is clicked.

* Template Block
The Template Block handler is applied to any HTML div element that belongs to the "core_template_block" class. This element must contain a single text node - a URL string that references an HTML document. The handler loads the referenced document and replaces the block element with the loaded content. 

```javascript
/*
  linkBlock accepts two arguments:

  * blockElement, a JQuery HTML Element
  * and done, a function that accepts a JQuery
    HTML Element.

  blockElement must represent an HTML link
  element that references a resource stored
  within Lucidity.

  linkBlock adds a click event handler to
  blockElement that replaces the Main Content
  element with the resource referenced by
  blockElement. linkBlock then passes
  blockElement to done.

  Note: All internal links must be Core Link
  Blocks.
*/
function linkBlock (blockElement, done) {
  addLoadClickEventHandler (blockElement);
  done (blockElement);
}

/*
  templateBlock accepts three arguments:

  * blockElement, a JQuery HTML Element
  * success, a function that accepts a JQuery HTML
    Element
  * and failure, a function that does not accept any
    arguments.

  blockElement must contain a single text node that 
  represents an HTML document URL.

  templateBlock will load the referenced document, 
  replace blockElement with the loaded content, and
  passes the content to success. If an error occurs,
  it will call failure instead. 
*/
function templateBlock (blockElement, success, failure) {
  var templateURL = blockElement.text ();
  replaceWithTemplate (templateURL, blockElement, success, failure);
}
```

### Block Auxiliary Functions

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
  replaceWithTemplate accepts four arguments:

  * url, a URL string
  * element, a JQuery HTML Element
  * success, a function that accepts a JQuery
    HTML Element
  * and failure, a function that does not accept
    any arguments.

  replaceWithTemplate replaces element with
  the HTML element referenced by url and passes
  referenced element to success.

  If an error occurs, replaceWithTemplate calls
  failure instead of success.
*/
function replaceWithTemplate (url, element, success, failure) {
  getTemplate (url,
    function (template) {
      element.replaceWith (template);
      success (template);
    },
    failure
  );
}

/*
  getTemplate accepts three arguments:

  * url, a URL string
  * success, a function that accepts a JQuery
    HTML Element
  * and failure, a function that does not accept
    any arguments.

  getTemplate loads the HTML template element
  referenced by url and passes it to success.

  If an error occurs, getTemplate throws a strict
  error and calls failure instead of success.
*/
function getTemplate (url, success, failure) {
  $.get (url, function (html) {
    var template = $(html);
    success (template);
    },
    'html'
  ).fail (function () {
    strictError ('[core][getTemplate] Error: an error occured while trying to load a template from "' + url + '".');
    failure ();
  });
}
```

### Auxiliary Functions

Core.js ends by defining a set of general auxiliary functions.

```javascript
/*
  strictError accepts one argument: message, a
  string. If the error mode has been set to strict,
  this function throws an exception with the given
  message. Note: the error mode is set by setting
  the "errorMode" parameter in settings.xml.
*/
function strictError (message) {
  if (STRICT_ERROR_MODE) {
    throw new Error (message);
  }
}

/*
  getContentLink accepts two arguments:

  * id, a Resource ID String 
  * and label, an optional JQuery HTML Element.

  getContentLink returns a JQuery HTML Element
  that represents an HTML link to the resource
  referenced by id.

  getContentLink adds a click event handler to
  the link element that replaces Main Content
  element with the resource referenced by id.
*/
function getContentLink (id, label) {
  var link = addLoadClickEventHandler ($('<a></a>').attr ('href', getContentURL (id)));
  if (label) {
    link.html (label)
  }
  return link;
}

/*
  addLoadClickEventHandler accepts a JQuery
  HTML Element, element, that represents an HTML
  link element and adds a click event handler
  to element that loads the resource referenced
  by element into the Main Content Element.
*/
function addLoadClickEventHandler (element) {
  element.addClass ('core_link');
  element.click (function (event) {
    event.preventDefault ();
    loadPage (getIdFromURL (new URI (element.attr ('href'))));
  });
  return element;
}

/*
  getContentURL accepts a URI string, id, and
  returns a URL string that references the entry
  referenced by id.

  Note: Every valid id must be a URI string. The
  host must equal the name of the module that
  defined the content type and the first query
  parameter must equal the content type.
*/
function getContentURL (id) {
  return new URI ('').hash (id).toString ();
}

/*
  getIdFromURL accepts a Content URL as a URI and
  returns its id parameter.
*/
function getIdFromURL (url) {
  return url.fragment ();
}

/*
  getContentType accepts an Id string and returns
  the content type associated with the resource
  referenced by the id string.
*/
function getContentType (id) {
  var type = new URI (id).segmentCoded (0);
  if (!type) {
    strictError ('[core][getContentType] Error: "' + id + '" is an invalid id. The "type" path parameter is missing.');
    return null;
  }
  return type;
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

/*
  getUniqueId returns an HTML id that is unique
  w.r.t the current document.
*/
function getUniqueId () {
  while ($('#id' + currentId).length > 0) {
    currentId ++;
  }
  return 'id' + (currentId ++);
}

/*
*/
function seq (fs, done, x) {
  _seq (0, fs, done, x);
}

/*
*/
function _seq (i, fs, done, x) {
  if (i >= fs.length) {
    return done ();
  }
  var f = fs [i];
  f (
    function () {
      _seq (i + 1, fs, done, x);
    },
    x
  );
}

/*
*/
function iter (f, xs, done) {
  _iter (0, f, xs, done);
}

/*
*/
function _iter (i, f, xs, done) {
  if (i >= xs.length) {
    return done ();
  }
  var x = xs [i];
  var next = function () {
    _iter (i + 1, f, xs, done);
  };
  f (x, next, next);
}

/*
  map accepts four arguments:

  * f, a function that accepts three arguments:
    x, a value; fsuccess, a function that accepts
    a value; and ffailure, a function that does
    not accept any arguments
  * xs, an array
  * success, a function that accepts an array
  * and failure, a function that does not accept
    any arguments.

  f must accept a value, x, and pass its result,
  y, to fsuccess.

  map applies f to every element, x, in xs;
  collects the results into an array, ys, and
  passes this array to success. If f calls
  ffailure at any point, map calls failure
  instead of success.
*/
function map (f, xs, success, failure) {
  _map (f, 0, xs, success, failure);
}

/*
  _map accepts five arguments:

  * f, a function that accepts three arguments:
    x, a value; fsuccess, a function that accepts
    a value; and ffailure, a function that does
    not accept any arguments
  * i, a natural number
  * xs, an array
  * success, a function that accepts an array
  * and failure, a function that does not accept
    any arguments.

  f must accept a value, x, and pass its result,
  y, to fsuccess.

  _map applies f to every element, x, in xs;
  collects the results into an array, ys, and
  passes this array to success. If f calls
  ffailure at any point, _map calls failure
  instead of success.
*/
function _map (f, i, xs, success, failure) {
  if (i >= xs.length) {
    return success ([]);
  }
  var x = xs [i];
  f (xs [i],
    function (y) {
      _map (f, i + 1, xs,
        function (ys) {
          ys.unshift (y);
          success (ys);
        },
        failure
      );
    },
    failure
  );
}

/*
  fold accepts five arguments:

  * f, a function that accepts four arguments:

    * z, the value returned by the last iteration
    * y, the next element in ys
    * fsuccess, a function that accepts the
      value returned by the current iteration
    * and ffailure, a function that does not
      accept any arguments

    computes the value of the current iteration
    and passes the value to fsuccess.

    If an error occurs, f calls ffailure instead.

  * x, the initial value used by the first
    iteration and returned if ys is empty
  * ys, an array
  * success, a function that accepts the value
    returned by the last iteration
  * and failure, a function that does not accept
    any arguments
*/
function fold (f, x, ys, success, failure) {
  _fold (0, f, x, ys, success, failure);
}

/*
*/
function _fold (i, f, x, ys, success, failure) {
  if (i >= ys.length) {
    return success (x);
  }
  var y = ys [i];
  f (x, y,
    function (z) {
      _fold (i + 1, f, z, ys, success, failure);
    },
    failure
  );
}

/*
  find accepts two arguments: predicate, a function
  that accepts a value and returns true or false;
  and elements, an array; and returns the first
  element in elements for which predicate returns
  true. If predicate does not return true for any
  of the values in elements, this function returns
  null.
*/
function find (predicate, elements) {
  for (var i = 0; i < elements.length; i ++) {
    if (predicate (elements [i])) { return elements [i]; }
  }
  return null;
}

// Unit tests for find. 
QUnit.test ('find', function (assert) {
  assert.equal (find (function () { return true; }, []), null, 'Returns null for Empty arrays.');
  assert.equal (find (function (x) { return x === 2; }, [1, 2, 3]), 2, 'Simple example 1.'); 
  assert.equal (find (function (x) { return x === 2; }, [1]), null, 'Simple example 2.');
});
```

### Generating Source Files

You can generate the Core module's source files using [Literate Programming](https://github.com/jostylr/literate-programming), simply execute:
`literate-programming Readme.md`
from the command line.

<!---
#### Core.js
```
_"Core Module"

_"QUnit Module Declaration"

_"Global Variables"

_"The Load Event Handler"

_"The Hash Change Event Handler"

_"Load Settings"

_"Register Modules"

_"Load Modules"

_"Register Block Handlers"

_"Expand Blocks"

_"Register Page Handlers"

_"Apply Page Handler"

_"The Core Block Handlers"

_"Block Auxiliary Functions"

_"Auxiliary Functions"
```
[core.js](#Core.js "save:")
-->
