/*
*/

/*
*/
var template_TEMPLATES = [];

/*
*/
function template_registerTemplate (template) {
  template_TEMPLATES.push (template);
}

/*
*/
function template_registerTemplates (templates) {
  for (var i = 0; i < templates.length; i ++) {
    template_registerTemplate (templates [i]);
  }
}

/*
*/
function template_page (id, success, failure) {
  var errorMsg = '[template][template_page] Error: an error occured while trying to load page template "' + id + '".';
  var template = template_getPageTemplate (id);
  if (!template) {
    strictError (errorMsg + ' The template does not exist.');
    return failure ();
  }
  if (!template.getPageElement) {
    strictError (errorMsg + ' The template is not a page template.');
    return failure ();
  }
  template.getPageElement (success, failure);
}

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

/*
*/
function template_Section (parent, id, children, getRawTemplate, classes) {
  template_Template.call (this, parent, id, getRawTemplate, classes);
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
template_Section.prototype.getElement = function (success, failure) {
  template_Template.prototype.getElement.call (this,
    function (template) {
      success (template.addClass ('template_section'));
    },
    failure
  );
}

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
function template_getPageTemplate (id) {
  return template_findPageTemplate (id, template_TEMPLATES);
}