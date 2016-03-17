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
    async.series (_handlers, done);
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
    async.applyEach (_handlers, id, done);
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
    // II. Load the enabled modules.
    loadModules (settings, function () {
      // III. Call the module load event handlers.
      MODULE_LOAD_HANDLERS.execute (function () {
        // IV. Get the initial page ID.
        var id = getIdFromURL (new URI ());
        if (!id) {
          id = settings.defaultId;
        }

        // V. Call the page load event handlers.
        PAGE_LOAD_HANDLERS.execute (id, function () {});
      });
    });
  });
});

/*
  This function will load the referenced page
  if the browser URL hash changes.
*/
$(window).on ('hashchange', function () {
  PAGE_LOAD_HANDLERS.execute (new URI ().fragment (), function () {});
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
  async.eachSeries (settings.modules,
    function (module, next) {
      module.enabled ? loadScript (module.url, next) : next ();
    },
    done
  );
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
        var error = new Error ('[core.js][loadScript] Error: an error occured while trying to load "' + url + '".');
        strictError (error);
        done (error);
      });
}

/*
  replaceWithTemplate accepts four arguments:

  * url, a URL string
  * element, a JQuery HTML Element
  * done, a function that accepts two arguments:
    an Error object and a JQuery HTML Element

  replaceWithTemplate replaces element with
  the HTML element referenced by url and passes
  referenced element to done.

  If an error occurs, replaceWithTemplate passes
  an Error object to done instead.
*/
function replaceWithTemplate (url, element, done) {
  getTemplate (url,
    function (error, template) {
      if (error) { return done (error); }

      element.replaceWith (template);
      done (null, template);
  });
}

/*
  getTemplate accepts three arguments:

  * url, a URL string
  * done, a function that accepts two arguments:
    an Error object and a JQuery HTML Element

  getTemplate loads the HTML template element
  referenced by url and passes it to done.

  If an error occurs, getTemplate throws a strict
  error and passes an error to done instead.
*/
function getTemplate (url, done) {
  $.get (url,
    function (html) {
      var template = $(html);
      done (null, template);
    },
    'html'
    ).fail (function () {
      var error = new Error ('[core][getTemplate] Error: an error occured while trying to load a template from "' + url + '".');
      strictError (error);
      done (error);
    });
}

/*
  strictError accepts one argument: error, an Error
  object. If the error mode has been set to strict,
  this function throws an exception with the given
  error. Note: the error mode is set by setting
  the "errorMode" parameter in settings.xml.
*/
function strictError (error) {
  if (STRICT_ERROR_MODE) {
    throw error;
  }
}

/*
  loadPage accepts three arguments:

  * id, a Page ID string

  loadPage triggers a Page Load Event using id
  as the page ID.
*/
function loadPage (id) {
  // I. Load the referenced page.
  // Note: The hashchange event handler is
  // responsible for actually loading the page
  // at this point.
  document.location.href = getContentURL (id);
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
    strictError (new Error ('[core][getContentType] Error: "' + id + '" is an invalid id. The "type" path parameter is missing.'));
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
