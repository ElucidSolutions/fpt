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
*/
var currentId = 0;

/*
  Module Load Handler Stores store the loaded
  module initialization functions.
*/
function ModuleLoadHandlers () {
  // A Module Load Handler array.
  var _handlers = [];

  /*
    Accepts one argument: handler, a Module Load
    Handler; and adds handler to this store.
  */
  this.add = function (handler) { _handlers.push (handler); }

  /*
    Accepts one argument: done, a function;
    and calls all of the Module Load Handlers
    stored in this store before calling done.
  */
  this.execute = function (done) {
    seq (_handlers, done);
  }
}

/*
  A ModuleLoadHandlers that stores the registered
  Module Load Handlers.
*/
var MODULE_LOAD_HANDLERS = new ModuleLoadHandlers ();

/*
  Page Load Handler Stores store the registered
  Page Load Handlers and provide a safe interface
  for registering and retrieving them.
*/
function PageLoadHandlerStore () {
  // A Page Load Handler array.
  var _handlers = [];

  /*
    Accepts one argument: handler, a Page Load
    Handler; and adds handler to this store.
  */
  this.add = function (handler) { _handlers.push (handler); }

  /*
    Accepts one argument: handlers, a Page
    Load Handler array; and adds handlers to
    this store.
  */
  this.addHandlers = function (handlers) {
    Array.prototype.push (_handlers, handlers);
  }

  /*
    Accepts two arguments:

    * id, a page ID string
    * and done, a function

    calls all of the Page Load Handlers stored
    in this store on id and calls done.
  */
  this.execute = function (id, done) {
    seq (_handlers, done, id);
  }
}

/*
  A PageLoadHandlerStore that stores the
  registered Page Load Handlers.
*/
var PAGE_LOAD_HANDLERS = new PageLoadHandlerStore ();

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
      // III. Call the module load event handlers.
      MODULE_LOAD_HANDLERS.execute (function () {
        // IV. Call the page load event handlers.
        PAGE_LOAD_HANDLERS.execute (settings.defaultId, function () {
          // V. Fade out the overlay element.
          $('#overlay').fadeOut ('slow');
        });
      });
    });
  });
});

/*
  This function will load the referenced page
  if the browser URL hash changes.
*/
$(window).on ('hashchange', function () {
  // I. Fade in the overlay element.
  $('#overlay').fadeIn ('slow');

  // II. Call the page load event handlers.
  PAGE_LOAD_HANDLERS.execute (
    new URI ().fragment (),
    function () {
      // III. Fade out the overlay element.
      $('#overlay').fadeOut ('slow');
  });
});

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
  _loadModules (0, settings.modules, done);
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
  var link = $('<a></a>').attr ('href', getContentURL (id));
  if (label) {
    link.html (label)
  }
  return link;
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