Menu Module
===========

The Menu module provides developers with a way to organize content into tree-like structures composed of nodes and leafs.

The Menu module is defined by menu.js. This file defines the module's base classes, block handlers, and load event handler. The opening to this file reads.

```javascript
/*
  The Menu module provides developers with a way
  to organize content into tree-like structures
  composed of nodes and leafs.
*/
```

The Global Variables
--------------------

```javascript
/*
  The `menu_Menu` represents the site's global
  menu as a menu_Menu object.

*/
var menu_MENU = new menu_Menu ([]);
```

The Load Event Handler
----------------------

```javascript
/*
  The Menu module's load event handler. This
  function registers the module's block handlers.
*/
registerModule (
  function (done) {
    // I. Register the block handlers.
    registerBlockHandlers ({
      menu_contents_block:            menu_contentsBlock,
      menu_leaf_label_block:          menu_leafLabelBlock,
      menu_leaf_link_block:           menu_leafLinkBlock,
      menu_leaf_next_label_block:     menu_leafNextLabelBlock,
      menu_leaf_next_link_block:      menu_leafNextLinkBlock,
      menu_leaf_parent_label_block:   menu_leafParentLabelBlock,
      menu_leaf_parent_link_block:    menu_leafParentLinkBlock,
      menu_leaf_previous_label_block: menu_leafPreviousLabelBlock,
      menu_leaf_previous_link_block:  menu_leafPreviousLinkBlock,
      menu_node_label_block:          menu_nodeLabelBlock,
      menu_node_link_block:           menu_nodeLinkBlock,
      menu_node_next_label_block:     menu_nodeNextLabelBlock,
      menu_node_next_link_block:      menu_nodeNextLinkBlock,
      menu_node_parent_label_block:   menu_nodeParentLabelBlock,
      menu_node_parent_link_block:    menu_nodeParentLinkBlock,
      menu_node_previous_label_block: menu_nodePreviousLabelBlock,
      menu_node_previous_link_block:  menu_nodePreviousLinkBlock
    });

    done ();
});
```

The Block Handlers
------------------

The Menu module defined five block handlers. The most important of these is the Menu Contents block which returns an HTML element that represents a given menu node.

```javascript
/*
  menu_contentsBlock accepts three arguments:

  * blockElement, a JQuery HTML Element

  * success, a function that accepts a JQuery
    HTML Element

  * and failure, a function that does not accept
    any arguments.

  blockElement must be a DIV element that
  contains six child elements:

  * The first element must belong to the
    menu_id class and contain a single text node
    representing a menu element ID.

  * The second element must belong to the
    menu_num_columns class and contain a single
    text node specifying the number of columns
    that the menu element will be divided into.

  * The third element must belong to the
    menu_max_level class and contain an integer
    value specifying the maximum number of menu
    levels to include in the menu element.

  * The fourth element must belong to the
    max_expand_level class and contains an
    integer value specifying the maximum number
    of menu levels to initially display in the
    menu element.

  * The fifth element must belong to the
    menu_expandable class and must contain a
    single boolean value of "true" or "false". This
    element indicates whether or not users should
    be able to expand and collapse menu items
    beyond the max_expand_level.

  * and the sixth element must belong to the
  menu_selected_element_id class and contain a
  single text node representing the initially
  selected element ID.
  

  menu_contentsBlock:

  * loads the menu node referenced by menu_id

  * creates a new HTML element that represents
    the node using the settings provided by
    blockElement

  * replaces blockElement with the new element

  * and passes the element to success.

  If an error occurs, menu_contentsBlock calls
  failure instead of success.
*/
function menu_contentsBlock (blockElement, success, failure) {
  menu_MENU.getContentsBlock (blockElement, success, failure);
}

/*
  menu_leafLabelBlock accepts three arguments:

  * blockElement, a JQuery HTML Element
  * success, a function that accepts a JQuery
    HTML Element
  * and failure, a function that does not accept
    any arguments.

  blockElement must contain a single text node
  that represents a Menu Element ID.

  menu_leafLabelBlock:

  * loads referenced menu element
  * creates an HTML element that represents the
    element's title
  * replaces blockElement with the new element
  * and passes the new element to success.

  If an error occurs, menu_leafLabelBlock calls
  failure instead of success.
*/
function menu_leafLabelBlock (blockElement, success, failure) {
  menu_MENU.getLeafLabelBlock (blockElement, success, failure);
}

/*
  menu_leafLabelBlock accepts three arguments:

  * blockElement, a JQuery HTML Element
  * success, a function that accepts a JQuery
    HTML Element
  * and failure, a function that does not accept
    any arguments.

  blockElement must contain a single text node
  that represents a Menu Element ID.

  menu_leafLinkBlock:

  * loads the referenced menu element
  * creates an HTML link element that represents
    the menu element's title
  * replaces blockElement with the new element
  * and passes the new element to success.

  If an error occurs, menu_leafLinkBlock calls
  failure instead of success.
*/
function menu_leafLinkBlock (blockElement, success, failure) {
  menu_MENU.getLeafLinkBlock (blockElement, success, failure);
}

/*
*/
function menu_leafNextLabelBlock (blockElement, success, failure) {
  menu_MENU.getLeafNextLabelBlock (blockElement, success, failure);
}

/*
*/
function menu_leafNextLinkBlock (blockElement, success, failure) {
  menu_MENU.getLeafNextLinkBlock (blockElement, success, failure);
}

/*
*/
function menu_leafParentLabelBlock (blockElement, success, failure) {
  menu_MENU.getLeafParentLabelBlock (blockElement, success, failure);
}

/*
*/
function menu_leafParentLinkBlock (blockElement, success, failure) {
  menu_MENU.getLeafParentLinkBlock (blockElement, success, failure);
}

/*
*/
function menu_leafPreviousLabelBlock (blockElement, success, failure) {
  menu_MENU.getLeafPreviousLabelBlock (blockElement, success, failure);
}

/*
*/
function menu_leafPreviousLinkBlock (blockElement, success, failure) {
  menu_MENU.getLeafPreviousLinkBlock (blockElement, success, failure);
}

/*
  menu_nodeLabelBlock accepts three arguments:

  * blockElement, a JQuery HTML Element
  * success, a function that accepts a JQuery
    HTML Element
  * and failure, a function that does not accept
    any arguments.

  blockElement must contain a single text node
  that represents a Menu Element ID.

  menu_nodeLabelBlock:

  * loads the referenced menu element
  * creates an HTML link element that represents
    the menu element's title
  * replaces blockElement with the new element
  * and passes the new element to success.

  If an error occurs, menu_nodeLabelBlock calls
  failure instead of success.
*/
function menu_nodeLabelBlock (blockElement, success, failure) {
  menu_MENU.getNodeLabelBlock (blockElement, success, failure);
}

/*
  menu_nodeLinkBlock accepts three arguments:

  * blockElement, a JQuery HTML Element
  * success, a function that accepts a JQuery
    HTML Element
  * and failure, a function that does not accept
    any arguments.

  blockElement must contain a single text node
  that represents a Menu Element ID.

  menu_nodeLinkBlock:

  * loads the referenced menu element
  * creates an HTML link element that represents
    the menu element's title
  * replaces blockElement with the new element
  * and passes the new element to success.

  If an error occurs, menu_nodeLinkBlock calls
  failure instead of success.
*/
function menu_nodeLinkBlock (blockElement, success, failure) {
  menu_MENU.getNodeLinkBlock (blockElement, success, failure);
}

/*
*/
function menu_nodeNextLabelBlock (blockElement, success, failure) {
  menu_MENU.getNodeNextLabelBlock (blockElement, success, failure);
}

/*
*/
function menu_nodeNextLinkBlock (blockElement, success, failure) {
  menu_MENU.getNodeNextLinkBlock (blockElement, success, failure);
}

/*
*/
function menu_nodeParentLabelBlock (blockElement, success, failure) {
  menu_MENU.getNodeParentLabelBlock (blockElement, success, failure);
}

/*
*/
function menu_nodeParentLinkBlock (blockElement, success, failure) {
  menu_MENU.getNodeParentLinkBlock (blockElement, success, failure);
}

/*
*/
function menu_nodePreviousLabelBlock (blockElement, success, failure) {
  menu_MENU.getNodePreviousLabelBlock (blockElement, success, failure);
}

/*
*/
function menu_nodePreviousLinkBlock (blockElement, success, failure) {
  menu_MENU.getNodePreviousLinkBlock (blockElement, success, failure);
}
```

The Element Class
-----------------

The Element class defines a base class for both the Leaf and Node classes.

```javascript
/*
  The menu_Element class is a base class for both
  the menu_Leaf and menu_Node classes. It
  represents generic menu elements.

  The menu_Element function accepts four
  arguments:

  * parent, a menu_Element
  * id, a Menu Element ID
  * title, a string
  * and classes, a string.

  Note: If parent is not null, it must be a
  menu Node that contains this element in its
  children array.
*/
function menu_Element (parent, id, title, classes) {
  this.parent         = parent;
  this.id             = id;
  this.title          = title;
  this.classes        = classes;
}

/*
  getFirstLeaf returns the first menu_Leaf within
  the menu tree represented by this element.
*/
// menu_Element.prototype.getFirstLeaf = function () {}

/*
  getNode accepts a Menu Element ID and returns
  the first menu_Node within the menu tree
  represented by this element that has the
  given ID.
*/
// menu_Element.prototype.getNode = function (id) {}

/*
  getLeaf accepts a Menu Element ID and returns
  the first menu_Leaf within the menu tree
  represented by this element that has the
  given ID.
*/
// menu_Element.prototype.getLeaf = function (id) {}

/*
  getLinkElement returns a JQuery HTML Element that represents a link
*/
// menu_Element.prototype.getLinkElement = function () {}

/*
*/
menu_Element.prototype.getIndex = function () {
  if (!this.parent) { return null; }

  for (var i = 0; i < this.parent.children.length; i ++) {
    if (this.parent.children [i].id === this.id) { return i; }
  }
  strictError ('[menu][menu_Element.getIndex] Error: the "' + this.id + '" menu element references a parent ("' + this.parent.id + '") that does not list "' + this.id + '" as a child.');
  return null;
}

/*
*/
menu_Element.prototype.getNext = function () {
  if (!this.parent) { return null; }

  var i = this.getIndex () + 1;
  return this.parent.children.length > i ? this.parent.children [i] : null;
}

/*
*/
menu_Element.prototype.getPrevious = function () {
  if (!this.parent) { return null; }

  var i = this.getIndex () - 1;
  return i >= 0 ? this.parent.children [i] : null;
}

/*
*/
menu_Element.prototype.getAncestors = function () {
  return this.parent ? this.parent.getPath () : [];
}

/*
*/
menu_Element.prototype.getPath = function () {
  var ancestors = this.getAncestors ();
  ancestors.push (this);
  return ancestors;
}

/*
*/
menu_Element.prototype.getLevel = function () {
  return this.getPath ().length;
}

/*
*/
menu_Element.prototype.getLine = function () {
  var line = [];
  var path = this.getPath ();
  for (var i = 0; i < path.length; i ++) {
    line.push (path [i].id);
  };
  return line;
}

/*
*/
menu_Element.prototype.addAttributes = function (element) {
  return element
    .addClass (this.classes)
    .attr ('data-menu-id', this.id)
    .attr ('data-menu-level', this.getLevel ());
}

/*
*/
menu_Element.prototype.getLabelElement = function () {
  return this.addAttributes (
    $('<span></span>')
      .addClass ('menu_label')
      .addClass ('menu_title')
      .html (this.title));
}

/*
*/
menu_Element.prototype._getLinkElement = function (id) {
  return this.addAttributes (
    $('<a></a>')
      .addClass ('menu_link')
      .addClass ('menu_title')
      .attr ('href', getContentURL (id))
      .html (this.title));
}

/*
*/
menu_Element.prototype.getContentsItemElement = function (numColumns, depth) {
  return this.addAttributes ($('<li></li>').addClass ('menu_contents_item'));
}

/*
*/
menu_Element.prototype.getParentLabelElement = function () {
  return this.parent ? this.parent.getLabelElement () : null;
}

/*
*/
menu_Element.prototype.getParentLinkElement = function () {
  return this.parent ? this.parent.getLinkElement () : null;
}

/*
*/
menu_Element.prototype.getNextLabelElement = function () {
  var element = this.getNext ();
  return element ? element.getLabelElement () : null;
}

/*
*/
menu_Element.prototype.getNextLinkElement = function () {
  var element = this.getNext ();
  return element ? element.getLinkElement () : null;
}

/*
*/
menu_Element.prototype.getPreviousLabelElement = function () {
  var element = this.getPrevious ();
  return element ? element.getLabelElement () : null;
}

/*
*/
menu_Element.prototype.getPreviousLinkElement = function () {
  var element = this.getPrevious ();
  return element ? element.getLinkElement () : null;
}
```

The Leaf Class
--------------

The Leaf class defines the basic block elements and functions for leaves.

```javascript
/*
*/
function menu_Leaf (parent, id, title, classes) {
  menu_Element.call (this, parent, id, title, classes);
}

/*
*/
menu_Leaf.prototype = Object.create (menu_Element.prototype);

/*
*/
menu_Leaf.prototype.constructor = menu_Leaf;

/*
*/
menu_Leaf.prototype.getFirstLeaf = function () {
  return this;
}

/*
*/
menu_Leaf.prototype.getLeaf = function (id) {
  return this.id === id ? this : null;
}

/*
*/
menu_Leaf.prototype.getNode = function (id) {
  return null;
}

/*
*/
menu_Leaf.prototype.getLabelElement = function () {
  return menu_Element.prototype.getLabelElement.call (this).addClass ('menu_leaf_label');
}

/*
*/
menu_Leaf.prototype.getLinkElement = function () {
  return menu_Element.prototype._getLinkElement.call (this, this.id).addClass ('menu_leaf_link');
}

/*
*/
menu_Leaf.prototype.getContentsItemElement = function (numColumns, depth) {
  return menu_Element.prototype.getContentsItemElement.call (this, numColumns, depth)
    .addClass ('menu_contents_leaf_item')
    .append (this.getLinkElement ());
}
```

The Node Class
-----------------

Nodes are elements that may contain other elements.

```javascript
/*
*/
function menu_Node (parent, id, title, children, classes) {
  menu_Element.call (this, parent, id, title, classes);
  this.children = children;
}

/*
*/
menu_Node.prototype = Object.create (menu_Element.prototype);

/*
*/
menu_Node.prototype.constructor = menu_Node;

/*
*/
menu_Node.prototype.getLeaf = function (id) {
  for (var i = 0; i < this.children.length; i ++) {
    var element = this.children [i].getLeaf (id);
    if (element) { return element; }
  }
  return null;
}

/*
*/
menu_Node.prototype.getNode = function (id) {
  if (this.id === id) { return this; }

  for (var i = 0; i < this.children.length; i ++) {
    var element = this.children [i].getNode (id);
    if (element) { return element; }
  }
  return null;
}

/*
*/
menu_Node.prototype.getFirstLeaf = function () {
  for (var i = 0; i < this.children.length; i ++) {
    var leaf = this.children [i].getFirstLeaf ();
    if (leaf) { return leaf; }
  }
  return null;
}

/*
*/
menu_Node.prototype.getLabelElement = function () {
  return menu_Element.prototype.getLabelElement.call (this).addClass ('menu_node_label');
}

/*
*/
menu_Node.prototype.getLinkElement = function () {
  var leaf = this.getFirstLeaf ();
  return leaf ? this._getLinkElement (leaf.id) :
                this.getLabelElement ();
}

/*
*/
menu_Node.prototype.getContentsItemElement = function (numColumns, depth) {
  var element = menu_Element.prototype.getContentsItemElement.call (this, numColumns, depth)
    .addClass ('menu_node_contents_item');

  return depth === 0 ? 
    element.append (this.getLinkElement ()) :
    element
      .append (this.getLabelElement ())
      .append (this.getContentsElement (numColumns, depth));
}

/*
*/
menu_Node.prototype.getContentsElement = function (numColumns, depth) {
  var element = this.addAttributes ($('<ol></ol>').addClass ('menu_contents'));
  if (depth === 0) { return element; }

  for (var i = 0; i < this.children.length; i ++) {
    element.append (this.children [i].getContentsItemElement (numColumns, depth - 1));
  }
  return element;
}
```

The Menu Class
--------------

```javascript
/*
*/
function menu_Menu (children) {
  this.children = children;
}

/*
*/
menu_Menu.prototype.getLeaf = function (id) {
  for (var i = 0; i < this.children.length; i ++) {
    var element = this.children [i].getLeaf (id);
    if (element) { return element; }
  }
  return null;
}

/*
*/
menu_Menu.prototype.getNode = function (id) {
  for (var i = 0; i < this.children.length; i ++) {
    var element = this.children [i].getNode (id);
    if (element) { return element; }
  }
  return null;
}

/*
*/
menu_Menu.prototype.getLeafLabelBlock = function (blockElement, success, failure) {
  var element = this.getLeaf (blockElement.text ()).getLabelElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getLeafLinkBlock = function (blockElement, success, failure) {
  var element = this.getLeaf (blockElement.text ()).getLinkElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getLeafNextLabelBlock = function (blockElement, success, failure) {
  var element = this.getLeaf (blockElement.text ()).getNextLabelElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getLeafNextLinkBlock = function (blockElement, success, failure) {
  var element = this.getLeaf (blockElement.text ()).getNextLinkElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getLeafParentLabelBlock = function (blockElement, success, failure) {
  var element = this.getLeaf (blockElement.text ()).getParentLabelElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getLeafParentLinkBlock = function (blockElement, success, failure) {
  var element = this.getLeaf (blockElement.text ()).getParentLinkElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getLeafPreviousLabelBlock = function (blockElement, success, failure) {
  var element = this.getLeaf (blockElement.text ()).getPreviousLabelElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getLeafPreviousLinkBlock = function (blockElement, success, failure) {
  var element = this.getLeaf (blockElement.text ()).getPreviousLinkElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getNodeLabelBlock = function (blockElement, success, failure) {
  var element = this.getNode (blockElement.text ()).getLabelElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getNodeLinkBlock = function (blockElement, success, failure) {
  var element = this.getNode (blockElement.text ()).getLinkElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getNodeNextLabelBlock = function (blockElement, success, failure) {
  var element = this.getNode (blockElement.text ()).getNextLabelElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getNodeNextLinkBlock = function (blockElement, success, failure) {
  var element = this.getNode (blockElement.text ()).getNextLinkElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getNodeParentLabelBlock = function (blockElement, success, failure) {
  var element = this.getNode (blockElement.text ()).getParentLabelElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getNodeParentLinkBlock = function (blockElement, success, failure) {
  var element = this.getNode (blockElement.text ()).getParentLinkElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getNodePreviousLabelBlock = function (blockElement, success, failure) {
  var element = this.getNode (blockElement.text ()).getPreviousLabelElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
*/
menu_Menu.prototype.getNodePreviousLinkBlock = function (blockElement, success, failure) {
  var element = this.getNode (blockElement.text ()).getPreviousLinkElement ();
  blockElement.replaceWith (element);
  success (element);
}

/*
  getContentsBlock accepts three arguments:

  * blockElement, a JQuery HTML Element

  * success, a function that accepts a JQuery
    HTML Element

  * and failure, a function that does not accept
    any arguments.

  blockElement must be a DIV element that
  contains six child elements:

  * The first element must belong to the
    menu_id class and contain a single text node
    representing a menu element ID.

  * The second element must belong to the
    menu_num_columns class and contain a single
    text node specifying the number of columns
    that the menu element will be divided into.

  * The third element must belong to the
    menu_max_level class and contain an integer
    value specifying the maximum number of menu
    levels to include in the menu element.

  * The fourth element must belong to the
    max_expand_level class and contains an
    integer value specifying the maximum number
    of menu levels to initially display in the
    menu element.

  * The fifth element must belong to the
    menu_expandable class and must contain a
    single boolean value of "true" or "false". This
    element indicates whether or not users should
    be able to expand and collapse menu items
    beyond the max_expand_level.

  * and the sixth element must belong to the
  menu_selected_element_id class and contain a
  single text node representing the initially
  selected element ID.

  getContentsBlock:

  * loads the menu node referenced by menu_id

  * creates a new HTML element that represents
    the node using the settings provided by
    blockElement

  * replaces blockElement with the new element

  * and passes the element to success.

  If an error occurs, getContentsBlock calls
  failure instead of success.
*/
menu_Menu.prototype.getContentsBlock = function (blockElement, success, failure) {
  var self = this;
  getBlockArguments ([
      {'name': 'menu_id',                  'text': true, 'required': true},
      {'name': 'menu_num_columns',         'text': true, 'required': true},
      {'name': 'menu_max_level',           'text': true, 'required': true},
      {'name': 'menu_expand_level',        'text': true, 'required': true},
      {'name': 'menu_expandable',          'text': true, 'required': true},
      {'name': 'menu_selected_element_id', 'text': true, 'required': true}
    ],
    blockElement,
    function (blockArguments) {
      var node = self.getNode (blockArguments.menu_id);

      var element = node.getContentsElement (
        blockArguments.menu_num_columns,
        blockArguments.menu_max_level
      );

      var level = parseInt (blockArguments.menu_expand_level) + 1;
      menu_collapse (level, element);

      if (blockArguments.menu_expandable === 'true') {
        menu_makeCollapsable (level, blockArguments.menu_max_level, element);
      }

      var leaf = self.getLeaf (blockArguments.menu_selected_element_id);
      if (leaf) {
        var line = leaf.getLine ();

        menu_select     (blockArguments.menu_selected_element_id, element);
        menu_selectLine (line, element);

        if (blockArguments.menu_expandable === 'true') {
          menu_expandLine (line, element);
        }
      }

      blockElement.replaceWith (element);

      PAGE_LOAD_HANDLERS.push (
        function (done, id) {
          menu_deselect (element);
          var leaf = self.getLeaf (id);
          if (leaf) {
            var newLine = leaf.getLine ();
            menu_select     (id, element);
            menu_selectLine (newLine, element);
            menu_expandLine (newLine, element);
          }
          done ();
      });

      success (element);
    },
    failure
  );
}
```

Auxiliary Functions
-------------------

```javascript
/*
*/
function menu_columnate (numColumns, elements) {
  var columns = [];
  var numElements = elements.length / numColumns;
  for (var i = 0; i < numColumns; i ++) {
    columns.push (
      $('<div></div>')
        .addClass ('menu_column')
        .append (elements.slice (i * numElements, (i + 1) * numElements)));
  }
  return columns;
}

/*
*/
function menu_select (id, element) {
  $('.menu_contents_item[data-menu-id="' + id + '"]', element)
    .addClass ('menu_selected');
}

/*
*/
function menu_deselect (element) {
  $('.menu_selected', element).removeClass ('menu_selected');
  $('.menu_selected_line', element).removeClass ('menu_selected_line');
}

/*
*/
function menu_collapse (level, element) {
  $('.menu_contents_item', element).each (
    function (itemElementIndex, itemElement) {
      itemElement = $(itemElement);
      if (itemElement.attr ('data-menu-level') >= level) {
        itemElement.addClass ('menu_collapsed');
        $('> .menu_contents', itemElement).hide ();
      }
  });
}

/*
*/
function menu_expandLine (line, element) {
  for (var i = 0; i < line.length; i ++) {
    $('.menu_contents_item[data-menu-id="' + line [i] + '"]', element)
      .removeClass ('menu_collapsed')
      .children ('.menu_contents')
        .show ();
  }
}

/*
*/
function menu_selectLine (line, element) {
  for (var i = 0; i < line.length; i ++) {
   $('.menu_contents_item[data-menu-id="' + line [i] + '"]', element)
     .addClass ('menu_selected_line'); 
  }
}

/*
*/
function menu_makeCollapsable (expandLevel, maxLevel, element) {
  $('.menu_contents_item', element).each (
    function (itemElementIndex, itemElement) {
      itemElement = $(itemElement);
      var level = parseInt (itemElement.attr ('data-menu-level'));
      if (level >= expandLevel && level <= maxLevel) {
        var linkElement = $('> .menu_node_label', itemElement);
        linkElement.click (
          function (event) {
            event.preventDefault ();
            itemElement.toggleClass ('menu_collapsed');
            $('> .menu_contents', itemElement).slideToggle ();
        });
      }
  });
}
```

Generating Source Files
-----------------------

You can generate the Menu module's source files using [Literate Programming](https://github.com/jostylr/literate-programming), simply execute:
`literate-programming Readme.md`
from the command line.

<!---
#### Menu.js
```
_"Menu Module"

_"The Global Variables"

_"The Load Event Handler"

_"The Block Handlers"

_"The Element Class"

_"The Leaf Class"

_"The Node Class"

_"The Menu Class"

_"Auxiliary Functions"
```
[menu.js](#Menu.js "save:")
-->
