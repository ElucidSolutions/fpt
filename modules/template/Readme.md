Template Module
===============

The Template module allows other modules to define and nested templates.

```javascript
/*
*/
```

The Template Class
------------------

```javascript
/*
*/
function template_Template (parent, id, getRawElement, classes) {
  this.parent        = parent;
  this.id            = id;
  this.getRawElement = getRawElement;
  this.classes       = classes;
}

/*
*/
// template_Template.prototype.getPageTemplate = function (id) {}

/*
*/
// template_Template.prototype.getSectionTemplate = function (id) {}

/*
*/
template_Template.prototype.getAncestors = function () {
  return this.parent ? this.parent.getPath () : [];
}

/*
*/
template_Template.prototype.getPath = function () {
  var ancestors = this.getAncestors ();
  ancestors.push (this);
  return ancestors;
}

/*
*/
template_Template.prototype.getLine = function () {
  var line = [];
  var path = this.getPath ();
  for (var i = 0; i < path.length; i ++) {
    line.push (path [i].id);
  }
  return line;
}

/*
*/
template_Template.prototype.getLevel = function () {
  return this.getPath ().length;
}

/*
*/
template_Template.prototype.iterate = function (templateFunction, done) {
  templateFunction (this);
  done (); 
}

/*
*/
template_Template.prototype.getElement = function (success, failure) {
  var self = this;
  this.getRawElement (
    function (rawTemplate) {
      success (rawTemplate
        .addClass (self.classes)
        .attr ('data-template-id', self.id)
        .attr ('data-template-level', self.getLevel ()));
    },
    failure
  );
}
```

The Page Template Class
-----------------------

```javascript
/*
*/
function template_Page (parent, id, getRawElement, classes) {
  template_Template.call (this, parent, id, getRawElement, classes);
}

/*
*/
template_Page.prototype = Object.create (template_Template.prototype);

/*
*/
template_Page.prototype.constructor = template_Page;

/*
*/
template_Page.prototype.getPageTemplate = function (id) {
  return this.id === id ? this : null;
}

/*
*/
template_Page.prototype.getSectionTemplate = function (id) {
  return null;
}

/*
*/
template_Page.prototype.getElement = function (success, failure) {
  template_Template.prototype.getElement.call (this,
    function (template) {
      success (template.addClass ('template_page'));
    },
    failure
  );
}

/*
*/
template_Page.prototype.getPageElement = function (success, failure) {
  var templates = this.getPath ().reverse ();
  var pageTemplate = templates.shift ();
  pageTemplate.getElement (
    function (pageElement) {
      fold (
        function (element, sectionTemplate, success, failure) {
          sectionTemplate.getElement (
            function (sectionElement) {
              $('.template_id_block', sectionElement).replaceWith (sectionTemplate.id);
              $('.template_hole_block', sectionElement).replaceWith (element);
              success (sectionElement);
            },
            failure
          );
        },
        pageElement,
        templates,
        success,
        failure
      );
    },
    failure
  );
}
```

The Section Template Class
--------------------------

```javascript
/*
*/
function template_Section (parent, id, children, getRawElement, classes) {
  template_Template.call (this, parent, id, getRawElement, classes);
  this.children = children;
}

/*
*/
template_Section.prototype = Object.create (template_Template.prototype);

/*
*/
template_Section.prototype.constructor = template_Section;

/*
*/
template_Section.prototype.getPageTemplate = function (id) {
  return template_findPageTemplate (id, this.children);
}

/*
*/
template_Section.prototype.getSectionTemplate = function (id) {
  return this.id === id ? this : template_findSectionTemplate (id, this.children);
}

/*
*/
template_Section.prototype.iterate = function (templateFunction, done) {
  templateFunction (this);
  iter (
    function (template, next) {
      template.iterate (templateFunction, next);
    },
    this.children,
    done
  );
}

/*
*/
template_Section.prototype.getElement = function (success, failure) {
  template_Template.prototype.getElement.call (this,
    function (template) {
      success (template.addClass ('template_section'));
    },
    failure
  );
}
```
The Template Store Class
------------------------

```javascript
/*
  Template Stores store registered templates.
*/
function template_TemplateStore () {
  var self = this;

  /*
  */
  var _templates = [];

  /*
  */
  var _templateFunctions = {};

  /*
  */
  this.add = function (template) {
    // I. Add the template to the store.
    _templates.push (template);

    // II. Call template functions on the added templates.
    template.iterate (
      function (template, next) {
        var id = template.getId ();
        var templateFunctions = _templateFunctions [id];
        templateFunctions ? seq (templateFunctions, next, template) : next ();
    });
  }

  /*
  */
  this.addTemplateFunction = function (id, templateFunction) {
    if (!_templateFunctions [id]) { _templateFunctions [id] = []; }
    _templateFunctions [id].push (templateFunction);
  }

  /*
  */
  this.getPageTemplate = function (id, templateFunction) {
    var template = template_findPageTemplate (id, _templates);
    template ? templateFunction (template) : self.addTemplateFunction (id, templateFunction);
  }

  /*
  */
  this.getSectionTemplate = function (id, templateFunction) {
    var template = template_findSectionTemplate (id, _templates);
    template ? templateFunction (template) : self.addTemplateFunction (id, templateFunction);
  }
}
```

The Template Store
------------------

```javascript
/*
  A template_TemplateStore that stores all of
  the registered templates.
*/
var template_TEMPLATES = new template_TemplateStore ();
```

The Module Load Event Handler
-----------------------------

```javascript
/*
*/
MODULE_LOAD_HANDLERS.add (
  function (done) {
    // I. Register the block handlers.
    block_BLOCK_HANDLERS.add ('template_block', template_block);

    // II. Continue.
    done ();
});
```

The Page Block Handler
----------------------

```javascript
/*
*/
function template_block (context, success, failure, expand) {
  template_TEMPLATES.getPageTemplate (context.element.text (),
    function (pageTemplate) {
      pageTemplate.getPageElement (
        function (pageElement) {
          context.element.replaceWith (pageElement);

          // Define and register the page load event handler.
          PAGE_LOAD_HANDLERS.add (
            function (id, next) {
              template_TEMPLATES.getPageTemplate (id,
                function (newPageTemplate) {
                  pageTemplate.getPageElement (
                    function (newPageElement) {
                      pageElement.replaceWith (newPageElement);
                      expand (newPageElement, next);
                  });
              });
          });

          success (pageElement);
      });
  });
}
```

Auxiliary Functions
-------------------

```javascript
/*
*/
function template_findPageTemplate (id, templates) {
  for (var i = 0; i < templates.length; i ++) {
    var template = templates [i].getPageTemplate (id);
    if (template) { return template; }
  }
  return null;
} 

/*
*/
function template_findSectionTemplate (id, templates) {
  for (var i = 0; i < templates.length; i ++) {
    var template = templates [i].getSectionTemplate (id);
    if (template) { return template; }
  }
  return null;
}
```

Generating Source Files
-----------------------

You can generate the Template module's source files using [Literate Programming](https://github.com/jostylr/literate-programming), simply execute:
`literate-programming Readme.md`
from the command line.

<!---
#### Template.js
```
_"Template Module"

_"The Global Variables"

_"The Template Registration Functions"

_"The Page Handler Function"

_"The Template Class"

_"The Page Template Class"

_"The Section Template Class"

_"Auxiliary Functions"
```
[template.js](#Template.js "save:")
-->
