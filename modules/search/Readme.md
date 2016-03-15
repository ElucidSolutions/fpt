Search Module
=============

Global Variables
----------------

```javascript
/*
*/
var search_DATABASE_URL = 'modules/search/database.xml';

/*
*/
var search_DATABASE = {};

/*
*/
var search_INTERFACES = {};

/*
*/
var search_SOURCES = {};

/*
*/
var search_ENTRIES = {};

/*
*/
var search_LUNR_INDICES = {};
```

Load Event Handler
------------------

```javascript
/*
*/
MODULE_LOAD_HANDLERS.add (
  function (done) {
    // II. Load libraries.
    loadScript ('modules/search/lib/lunr/lunr.js',
      function () {
        // III. Load the search database.
        search_loadDatabase (search_DATABASE_URL,
          function (database) {
            search_DATABASE = database;

            // IV. Register the block handlers.
            block_HANDLERS.addHandlers ({
              search_filter_block:    search_filterBlock,
              search_form_block:      search_formBlock,
              search_index_block:     search_indexBlock,
              search_interface_block: search_interfaceBlock,
              search_link_block:      search_linkBlock,
              search_results_block:   search_resultsBlock
            });

            // V. Register the page handlers.
            page_HANDLERS.add ('search_page_block', 'modules/search/templates/search_page.html');

            done ();
          },
          done
        );
    });
});
```

Block Handlers
--------------

```javascript
/*
*/
function search_filterBlock (context, success, failure, expand) {
  var interface = search_INTERFACES [context.element.text ()];
  if (!interface) {
    strictError ('[search][search_filterBlock] Error: The "' + context.element.text () + '" search interface has not been initialized.'); 
    return failure ();
  }
  interface.getFilterElement (
    function (filterElement) {
      context.element.replaceWith (filterElement);
      success (filterElement);
    },
    failure, expand
  );
}

/*
  search_form_block accepts three arguments:

  * context, a Block Expansion Context
  * and success and failure, two functions that
    do not accept any arguments.

  context.element must contain a single text node
  that represents a Search Interface id.

  search_form_block replaces context.element with an
  inline search form and calls success. Whenever
  a query is entered into the form, an event
  handler executes the query against the
  referenced search interface.

  If an error occurs, search_block calls failure
  instead of success.
*/
function search_formBlock (context, success, failure) {
  var interface = search_INTERFACES [context.element.text ()];
  if (!interface) {
    strictError ('[search][search_formBlock] Error: The "' + context.element.text () + '" search interface has not been initialized.');
    return failure ();
  }
  var element = search_createFormElement (interface);
  context.element.replaceWith (element);
  success (element);
}

/*
*/
function search_indexBlock (context, success, failure) {
  var indexName = context.element.text ();
  var index = search_DATABASE [indexName];
  if (!index) {
    strictError ();
    return failure ();
  }
  index.getLunrIndex (
    function (lunrIndex) {
      var element = $('<div></div>')
        .addClass ('search_index')
        .append ($('<div></div>')
          .addClass ('search_index_name')
          .text (indexName))
        .append ($('<textarea></textarea>')
          .addClass ('search_lunr_index')
          .text (JSON.stringify (lunrIndex.toJSON ())));

      context.element.replaceWith (element);
      success ();
    },
    failure
  ); 
}

/*
  search_interfaceBlock accepts three arguments:

  * context, a Block Expansion Context
  * and success and failure, two functions that
    do not accept any arguments.

  context.element must have an HTML ID attribute
  and contain a single text node that represents
  a Search ID.

  search_interfaceBlock removes context.element,
  creates a search interface linked to the index
  given by the search ID, adds the interface to
  search_INTERFACES using context.element's ID as
  the interface ID, and calls success.

  If the search ID includes a query,
  search_interfaceBlock executes it before
  calling success.

  If an error occurs, search_interfaceBlock
  calls failure instead of success.
*/
function search_interfaceBlock (context, success, failure) {
  var errorMessage = '[search][search_interfaceBlock]';

  // I. Get the interface ID
  var interfaceId = context.element.attr ('id');
  if (!interfaceId) {
    strictError (errorMessage + ' Error: The Search Interface block is invalid. The HTML ID attribute is required for Search Interface blocks.');
    return failure ();
  }

  // II. Parse the search ID
  var searchId    = new URI (context.element.text ());
  var indexName   = searchId.segmentCoded (1);
  var query       = searchId.segmentCoded (2);
  var start       = parseInt (searchId.segment (3), 10);
  var num         = parseInt (searchId.segment (4), 10);

  if (isNaN (start)) {
    strictError (errorMessage + ' Error: "' + context.element.text () + '" is an invalid search id. The "start" parameter is missing or invalid.');
    start = 0;
  }
  if (isNaN (num)) {
    strictError (errorMessage + ' Error: "' + context.element.text () + '" is an invalid search id. The "num" parameter is missing or invalid.');
    num = 10;
  }

  // II. Remove the block element
  context.element.remove ();

  // III. Create and register the search interface 
  var index = search_DATABASE [indexName];
  if (!index) {
    strictError ();
    return failure ();
  }

  var interface = new search_Interface (index, start, num);

  search_INTERFACES [interfaceId] = interface;

  query ? interface.search (query, success) : success ();
}

/*
  search_linkBlock accepts three arguments:

  * context, a Block Expansion Context
  * and done, a function that does not accept
    any arguments.

  context.element must contain a single text node
  that represents a Search ID. 

  search_linkBlock replaces context.element with
  a search form linked to the referenced search
  index and calls done. Whenever a user enters
  a query into the form, the Search module will
  redirect them to the search results page.
*/
function search_linkBlock (context, done) {
  var searchId = new URI (context.element.text ());
  var element = search_createLinkElement (searchId);
  context.element.replaceWith (element);
  done (element);
}

/*
  search_resultsBlock accepts four arguments:
  
  * context, a Block Expansion Context
  * success, a function that acepts a JQuery
    HTML Element
  * failure, a function that does not accept
    any arguments
  * and expand, a function that accepts a JQuery
    HTML Element.

  context.element must contain a single text node
  that represents a Search Interface ID.

  search_resultsElement replaces context.element
  with a search results element that lists the
  results returned by the last query executed
  against the referenced interface and then calls
  success. Whenever the interface executes a
  new query, an event handler updates this list.

  If an error occurs, search_resultsBlock calls
  failure instead of success.
*/
function search_resultsBlock (context, success, failure, expand) {
  var interface = search_INTERFACES [context.element.text ()];
  if (!interface) {
    strictError ('[search][search_resultsBlock] Error: The "' + context.element.text () + '" search interface has not been initialized.');
    return failure ();
  }
  interface.getResultsElement (
    function (resultsElement) {
      context.element.replaceWith (resultsElement);
      success (resultsElement);
    },
    failure, expand
  );
} 
```

Auxiliary Functions
-------------------

```javascript
/*
*/
function search_registerSource (name, source) {
  if (search_SOURCES [name]) {
    return strictError ();
  }
  search_SOURCES [name] = source;
}
```

Database
--------

```javascript
/*
*/
function search_loadDatabase (url, success, failure) {
  $.ajax (url, {
    dataType: 'xml',
    success: function (doc) {
      success (search_parseDatabase (doc));
    },
    error: function (request, status, error) {
      strictError ();
      failure (); 
    }
  });
}

/*
*/
function search_parseDatabase (databaseElement) {
  var database = {};
  $('> database > index', databaseElement).each (
    function (i, indexElement) {
      database [$('> name', indexElement).text ()]
        = new search_Index (
            $('> lunrIndexURL', indexElement).text (),
            $('> setIds > setId', indexElement).map (
              function (i, setElement) {
                return $(setElement).text ();
              }).toArray ());
  });
  return database;
}
```

Index
-----

```javascript
/*
*/
function search_Index (lunrIndexURL, setIds) {
  this.lunrIndexURL = lunrIndexURL;
  this.setIds = setIds;
}

/*
*/
search_Index.prototype.getLunrIndex = function (success, failure) {
  if (this.lunrIndex) {
    return success (this.lunrIndex);
  } 
  if (this.lunrIndexURL) {
    var self = this;
    return search_loadLunrIndex (this.lunrIndexURL,
      function (lunrIndex) {
        self.lunrIndex = lunrIndex;
        success (lunrIndex);
      },
      failure
    );
  }
  this.createLunrIndex (success, failure);
}

/*
*/
search_Index.prototype.createLunrIndex = function (success, failure) {
  var self = this;
  this.getEntries (
    function (entries) {
      self.lunrIndex = search_createLunrIndex (entries);
      success (self.lunrIndex);
    },
    failure
  );
}

/*
*/
search_Index.prototype.getEntries = function (success, failure) {
  if (this.entries) {
    return success (this.entries);
  }
  var self = this;
  search_getSetsEntries (this.setIds,
    function (entries) {
      self.entries = entries;
      success (entries);
    },
    failure
  );
}

/*
*/
function search_loadLunrIndex (url, success, failure) {
  $.get (url,
    function (json) {
      index = lunr.Index.load (json);
      success (index);
    },
    'json'
  ).fail (function () {
    strictError ();
    failure ();
  });
}
```

Entry
-----

```javascript
/*
*/
function search_Entry (id) {
  this.id = id;
}

/*
*/
search_Entry.prototype.getResultElement = function (done) {
  done ($('<li></li>')
    .addClass ('search_result')
    .addClass ('search_' + getContentType (this.id) + '_result')
    .append ($('<div></div>')
      .addClass ('search_result_id')
      .append (getContentLink (this.id, this.id))));
}

/*
*/
function search_getEntriesResultElements (entries, success, failure) {
  map (
    function (entry, success, failure) {
      entry.getResultElement (success);
    },
    entries, success, failure
  );
}
```


Interface
---------

```javascript
/*
*/
function search_Interface (index, start, num) {
  this.index               = index;
  this.query               = ''; 
  this.start               = start;
  this.num                 = num;
  this.results             = []; 
  this.searchEventHandlers = [];
}

/*
*/
search_Interface.prototype.search = function (query, done) {
  this.query = query;
  var self = this;
  this.index.getLunrIndex (
    function (lunrIndex) {
      self.results = lunrIndex.search (query);
      self.callSearchEventHandlers (done);
    },
    done
  );
}

/*
*/
search_Interface.prototype.callSearchEventHandlers = function (done) {
  seq (this.searchEventHandlers, done);
}

/*
*/
search_Interface.prototype.getFilterElement = function (success, failure, expand) {
  var filterElement = $('<ol></ol>').addClass ('search_filter');

  var self = this;
  this.getFilterElements (
    function (filterElements) {
      self.searchEventHandlers.push (
	function (done) {
	  self.getFilterElements (
	    function (filterElements) {
	      expand (filterElement.empty ().append (resultElements), done);
	    },
	    done
	  );
      });

      success (filterElement.append (resultElements));
    },
    failure
  );
}

/*
*/
search_Interface.prototype.getFilterElements = function (success, failure) {
  if (!this.query) {
    return this.index.getEntries (
      function (entries) {
        search_getEntriesResultElements (entries, success, failure);
      },
      failure
    );
  }
  this.getResultElements (success, failure);
}

/*
*/
search_Interface.prototype.getResultsElement = function (success, failure, expand) {
  var self = this;
  this.getResultElements (
    function (resultElements) {
      var resultsElement = $('<ol></ol>').addClass ('search_results').append (resultElements);

      self.searchEventHandlers.push (
        function (done) {
          self.getResultElements (
            function (resultElements) {
              expand (resultsElement.empty ().append (resultElements), done);
            },
            done 
          );
      });
      success (resultsElement);
    },
    failure
  );
}

/*
*/
search_Interface.prototype.getResultElements = function (success, failure) {
  var self = this;
  this.getResultEntries (
    function (entries) {
      search_getEntriesResultElements (entries, success, failure);
    },
    failure
  );
}

/*
*/
search_Interface.prototype.getResultEntries = function (success, failure) {
  var self = this;
  this.index.getEntries (
    function (entries) {
      success (self.getResults ().map (
        function (result) {
          var entry = search_getEntry (entries, result.ref);
          if (!entry) {
            strictError ();
            return;
          }
          return entry;
      }));
    },
    failure
  );
}

/*
*/
search_Interface.prototype.getResults = function () {
  return this.results.slice (this.start, this.start + this.num);
}
```

Lunr
----

```javascript
/*
*/
function search_createLunrIndex (entries) {
  var index = lunr (
    function () {
      var names = search_getFieldNames (entries);
      var numNames = names.length;
      for (var i = 0; i < numNames; i ++) {
        this.field (names [i]);
      }
  });
  var numEntries = entries.length;
  for (var i = 0; i < numEntries; i ++) {
    index.add (entries [i]);
  }
  return index;
}

/*
*/
function search_getFieldNames (entries) {
  var names = [];
  var numEntries = entries.length;
  for (var i = 0; i < numEntries; i ++) {
    var entry = entries [i];
    var entryNames = Object.keys (entry);
    var numEntryNames = entryNames.length;
    for (var j = 0; j < numEntryNames; j ++) {
      var entryName = entryNames [j];
      if (names.indexOf (entryName) === -1) {
        names.push (entryName);
      }
    }
  }
  return names;
}

/*
*/
function search_getSetsEntries (setIds, success, failure) {
  fold (
    function (entries, setId, success, failure) {
      search_getSetEntries (setId,
        function (sourceEntries) {
          Array.prototype.push.apply (entries, sourceEntries);
          success (entries);
        },
        failure
      );
    },
    [], setIds, success, failure
  );
}

/*
*/
function search_getSetEntries (setId, success, failure) {
  if (search_ENTRIES [setId]) {
    return success (search_ENTRIES [setId]);
  }

  var path = new URI (setId).segmentCoded ();
  if (path.length < 1) {
    strictError ();
    return failure ();
  }

  var sourceName = path [0];
  var source = search_SOURCES [sourceName];
  if (!source) {
    strictError ();
    return failure ();
  }

  var setName = path.length > 1 ? path [1] : null;
  source (setName, success, failure);
}

/*
*/
function search_getEntry (entries, id) {
  for (var i = 0; i < entries.length; i ++) {
    if (entries [i].id === id) {
      return entries [i];
    }
  }
  return null;
}
```

Block Elements
--------------

```javascript
/*
  search_createFormElement accepts one argument:
  interface, a Search Interface; and returns a
  search form element linked to interface as a
  JQuery HTML Element.
*/
function search_createFormElement (interface) {
  var element = $('<input></input>')
    .addClass ('search_form')
    .attr ('type', 'text')
    .attr ('placeholder', 'Search')
    .val (interface.query)
    .on ('input', function () {
       interface.search ($(this).val (), function () {});
     });

  interface.searchEventHandlers.push (
    function (done) {
      element.val (interface.query);
      done ();
  });

  return element;
}

/*
  search_createLinkElement accepts one argument:
  searchId, a Search Id; and returns a search
  form as a JQuery HTML Element.

  If a user enters a query in the form, the
  Search module will redirect the user to the
  search results page with the query.
*/
function search_createLinkElement (searchId) {
  return $('<input></input>')
    .addClass ('search_link')
    .attr ('type', 'text')
    .attr ('placeholder', 'Search')
    .val (searchId.segmentCoded (2))
    .keypress (function (event) {
      if (event.which === 13) {
        var keywords = $(this).val ();
        var id = new URI ('')
          .segmentCoded ('search_page_block')
          .segmentCoded (searchId.segmentCoded (1))
          .segmentCoded (keywords ? keywords : ' ')
          .segment (searchId.segment (3))
          .segment (searchId.segment (4))
          .toString ();

        loadPage (id, function () {});
      }
    });
}
```

Search Page
-----------

The Search module defines a page handler. This page handler accepts a Search Id and returns a list of search results. The page template is located in [templates/search_page.html.default](#Search Page "save:") and is presented below.

```html
<div id='main_content'>
  <div id='search_interface' class='search_interface_block'><span class='core_id_block'/></div>
  <div id='body'>
    <h1>Search</h1>
    <div class='search_form_block'>search_interface</div>
    <h2>Search Results</h2>
    <div class='search_results_block'>search_interface</div>
  </div>
</div>
```

Example Database
----------------

The Search Database file defines the search database and its indicies. An example database file can be found here: [database.xml.example](#Example Database "save:").

```xml
<?xml version="1.0" encoding="utf-8"?>
<database>
  <index>
    <name>search</name>
    <lunrIndexURL>data/indices/search_index.json</lunrIndexURL>
    <setIds>
      <setId>book_search_source/data%2Fbooks.xml</setId>
      <setId>video_library_search_source/eoffer</setId>
      <setId>video_library_search_source/emod</setId>
    </setIds>
  </index>
  <index>
    <name>video_search</name>
    <lunrIndexURL>data/indices/videos_index.json</lunrIndexURL>
    <setIds>
      <setId>video_library_search_source/eoffer</setId>
      <setId>video_library_search_source/emod</setId>
    </setIds>
  </index>
</database>
```

Database Schema
---------------

The Search Database file is an XML file that must conform to the following XML Schema which can be found here: [database.xsd](#Database Schema "save:").

```xml
<?xml version="1.0" encoding="utf-8"?>
<!-- This file defines the Search schema. -->
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <!-- Define the root element -->
  <xs:element name="database">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="index" type="indexType" minOccurs="0" maxOccurs="unbounded"/>
      </xs:sequence>
    </xs:complexType>
    <xs:unique name="uniqueIndexName">
      <xs:selector xpath="index"/>
      <xs:field xpath="name"/>
    </xs:unique>
  </xs:element>

  <!-- Define the index element type -->
  <xs:complexType name="indexType">
    <xs:all>
      <xs:element name="name" type="xs:string"/>
      <xs:element name="lunrIndexURL" type="xs:anyURI" minOccurs="0"/>
      <xs:element name="setIds">
        <xs:complexType>
          <xs:sequence>
          <xs:element name="setId" type="xs:anyURI" maxOccurs="unbounded"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:all>
  </xs:complexType>
</xs:schema>
```

Generating Source Files
-----------------------

You can generate the Search module's source files using [Literate Programming](https://github.com/jostylr/literate-programming), simply execute:
`literate-programming Readme.md`
from the command line.

<!---
### Search.js
```
_"Global Variables"

_"Load Event Handler"

_"Block Handlers"

_"Auxiliary Functions"

_"Database"

_"Index"

_"Entry"

_"Interface"

_"Lunr"

_"Block Elements"
```
[search.js](#Search.js "save:")
-->
