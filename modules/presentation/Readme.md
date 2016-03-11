Presentation Module
===================

The Presentation module defines the Presentation content type. This module defines a block type called Slide which displays an interactive slide. These slides are stored in a database.

Global Variables
----------------

```javascript
/*
*/
var presentation_DATABASE_URL = 'modules/presentation/database.xml';

/*
*/
var presentation_DATABASE = {};
```

The Load Event Handler
----------------------

```javascript
/*
*/
MODULE_LOAD_HANDLERS.add (
  function (done) {
    // I. Load the Intro.JS library.
    loadScript ('modules/presentation/lib/intro.js-2.0.0/intro.js',
      function () {
        // II. Load the Intro.JS stylesheets.
        $.getCSS ('modules/presentation/lib/intro.js-2.0.0/introjs.css');

        // III. Load the Presentation database.
        presentation_loadDatabase (
          presentation_DATABASE_URL,
          function (database) {
            // IV. Cache the Presentation database.
            presentation_DATABASE = database;

            // V. Register the block handlers.
            block_HANDLERS.add ('presentation_slide_block', presentation_slideBlock);

            // VI. Continue.
            done ();
          },
          function () {}
        );
  });
});
```

The Block Handlers
------------------

```javascript
/*
*/
function presentation_slideBlock (context, success, failure) {
  var slideElementId = context.element.attr ('id');
  if (!slideElementId) {
    slideElementId = getUniqueId ();
  }

  var slideElement = presentation_DATABASE.getSlide (context.element.text ()).createElement (slideElementId);
  presentation_SLIDE_ELEMENTS.save (slideElement);

  var element = slideElement.getElement ();
  context.element.replaceWith (element);
  success (element);
}
```

The Step Class
--------------

```javascript
/*
*/
function presentation_Step (id, text, position, top, left, width, height) {
  this.id        = id;
  this.text      = text;
  this.position  = position;
  this.top       = top;
  this.left      = left;
  this.width     = width;
  this.height    = height;
}

/*
*/
presentation_Step.prototype.lockStep = function (intro) {
  intro.locked = true;
  $('.introjs-nextbutton', intro._targetElement)
    .addClass ('introjs-disabled');
}

/*
*/
presentation_Step.prototype.unlockStep = function (intro) {
  intro.locked = false;
  $('.introjs-nextbutton', intro._targetElement)
    .removeClass ('introjs-disabled')
}


/*
*/
presentation_Step.prototype.onShow = function (intro) {}

/*
*/
presentation_Step.prototype.createElement = function () {
  return $('<div></div>')
    .addClass ('presentation_step')
    .attr ('data-presentation-step', this.id)
    .attr ('id',                     getUniqueId ())
    .css ('position',                'absolute')
    .css ('top',                     this.top)
    .css ('left',                    this.left)
    .css ('width',                   this.width)
    .css ('height',                  this.height);
}

/*
*/
// function presentation_parseStep (slidePath, element) {}
```

The Button Step Class
---------------------

```javascript
/*
*/
function presentation_ButtonStep (id, text, position, top, left, width, height) {
  presentation_Step.call (this, id, text, position, top, left, width, height);
  this.completed = false;
}

/*
*/
presentation_ButtonStep.prototype = Object.create (presentation_Step.prototype);

/*
*/
presentation_ButtonStep.prototype.constructor = presentation_ButtonStep;

/*
*/
presentation_ButtonStep.prototype.onShow = function (intro) {
  this.completed ?
    this.unlockStep (intro):
    this.lockStep (intro);
}

/*
*/
presentation_ButtonStep.prototype.createElement = function (intro) {
  var self = this;
  return presentation_Step.prototype.createElement.call (this, intro)
    .addClass ('presentation_button_step')
    .click (
      function (event) {
        event.stopPropagation ();
        self.completed = true;
        self.unlockStep (intro);
        intro.nextStep ();
     });
}

/*
*/
function presentation_parseButtonStep (slidePath, element) {
  var path = slidePath.concat ($('> name', element).text ());
  return new presentation_ButtonStep (
    presentation_getId ('presentation_step_page', path),
    $('> text',     element).text (),
    $('> position', element).text (),
    $('> top',      element).text (),
    $('> left',     element).text (),
    $('> width',    element).text (),
    $('> height',   element).text ()
  );
}
```

The Input Step Class
--------------------

```javascript
/*
*/
function presentation_InputStep (id, text, position, top, left, width, height, expression) {
  presentation_Step.call (this, id, text, position, top, left, width, height);
  this.expression = expression;
}

/*
*/
presentation_InputStep.prototype = Object.create (presentation_Step.prototype);

/*
*/
presentation_InputStep.prototype.constructor = presentation_InputStep;

/*
*/
presentation_InputStep.prototype.checkInput = function (inputElement) {
  var expression = new RegExp (this.expression);
  return expression.test (inputElement.val ());
}

/*
*/
presentation_InputStep.prototype.onShow = function (intro) {
  var inputElement = $('[data-presentation-step="' + this.id + '"] > input', intro._targetElement);
  this.checkInput (inputElement) ?
    this.unlockStep (intro):
    this.lockStep (intro);
}

/*
*/
presentation_InputStep.prototype.createElement = function (intro) {
  var element = presentation_Step.prototype.createElement.call (this, intro)
    .addClass ('presentation_input_step');

  var self = this;
  var inputElement = $('<input></input>')
    .attr ('type', 'text')
    .keyup (
      function () {
        if (self.checkInput (inputElement)) {
          self.unlockStep (intro);
          element.addClass ('presentation_valid')
            .removeClass ('presentation_invalid');
        } else {
          self.lockStep (intro);
          element.removeClass ('presentation_valid')
            .addClass ('presentation_invalid');
        }
    });

  element.append (inputElement);

  return element;
}

/*
*/
function presentation_parseInputStep (slidePath, element) {
  var path = slidePath.concat ($('> name', element).text ());
  return new presentation_InputStep (
    presentation_getId ('presentation_input_step_page', path),
    $('> text',         element).text (),
    $('> position',     element).text (),
    $('> top',          element).text (),
    $('> left',         element).text (),
    $('> width',        element).text (),
    $('> height',       element).text (),
    $('> expression',   element).text ()
  );
}
```

The Quiz Step Class
-------------------

```javascript
/*
  presentation_QuizStep accepts eight arguments:

  * id, an HTML ID string
  * text, an HTML string
  * position, either 'top', 'bottom', 'left', or 'right'
  * top, a CSS Length string
  * left, a CSS Length string
  * width, a CSS Length string
  * height, a CSS Length string
  * and options an Options array

  and returns a new presentation_QuizStep object.

  Note: Every Option element must have the following stucture:

    {label: <string>, isCorrect: <bool>, onSelect: <string>}
*/
function presentation_QuizStep (id, text, position, top, left, width, height, options) {
  presentation_Step.call (this, id, text, position, top, left, width, height);
  this.options = options;
}

/*
*/
presentation_QuizStep.prototype = Object.create (presentation_Step.prototype);

/*
*/
presentation_QuizStep.prototype.constructor = presentation_QuizStep;

/*
*/
presentation_QuizStep.prototype.getCorrectOption = function () {
  for (var i = 0; i < this.options.length; i ++) {
    var option = this.options [i];
    if (option.isCorrect) {
      return option;
    }
  }
  strictError ('[presentation][getCorrectOption] Error: an error occured while trying to retrieve the correct value for a presentation test step. The test does not have a correct value.');
  return null;
}

/*
*/
presentation_QuizStep.prototype.getSelectedValue = function (optionsElement) {
  return $('input[name="' + this.id + '"]:checked', optionsElement).val ();
}

/*
*/
presentation_QuizStep.prototype.getSelectedOption = function (optionsElement) {
  var selectedValue = this.getSelectedValue (optionsElement);
  for (var i = 0; i < this.options.length; i ++) {
    var option = this.options [i];
    if (option.label === selectedValue) {
      return option;
    }
  }
  return null;
}

/*
*/
presentation_QuizStep.prototype.checkInput = function (optionsElement) {
  var correctOption = this.getCorrectOption ();
  return correctOption && correctOption.label === this.getSelectedValue (optionsElement);
}

/*
*/
presentation_QuizStep.prototype.onShow = function (intro) {
  var optionsElement = $('[data-presentation-step="' + this.id + '"] .presentation_options', intro._targetElement);
  this.checkInput (optionsElement) ?
    this.unlockStep (intro):
    this.lockStep (intro);
}

/*
*/
presentation_QuizStep.prototype.onClick = function (intro, stepElement) {
  var optionsElement = $('.presentation_options', stepElement);

  var selectedOption = this.getSelectedOption (optionsElement);
  $('.presentation_message', stepElement).text (selectedOption.onSelect);

  if (this.checkInput (optionsElement)) {
     this.unlockStep (intro);
     stepElement.addClass ('presentation_valid')
       .removeClass ('presentation_invalid');
  } else {
     this.lockStep (intro);
     stepElement.removeClass ('presentation_valid')
       .addClass ('presentation_invalid');
  }
}

/*
*/
presentation_QuizStep.prototype.createElement = function (intro) {
  var element = presentation_Step.prototype.createElement.call (this, intro)
    .addClass ('presentation_quiz_step');

  var testElement = $('<div></div>')
    .addClass ('presentation_test')
    .append ($('<div></div>').addClass ('presentation_message'));

  element.append (testElement);

  var optionsElement = $('<div></div>').addClass ('presentation_options');
  testElement.append (optionsElement);

  var self = this;
  for (var i = 0; i < this.options.length; i ++) {
    var option = this.options [i];
    optionsElement.append (
      $('<div></div>')
        .addClass ('presentation_option')
        .append ($('<input></input>')
          .attr ('type', 'radio')
          .attr ('name', this.id)
          .attr ('value', option.label)
          .addClass ('presentation_option_input')
          .click (
            function () {
              self.onClick (intro, element);
          }))
        .append ($('<label></label>')
          .addClass ('presentation_option_label')
          .text (option.label)));
  }
  return element;
}

/*
*/
function presentation_parseTestStep (slidePath, element) {
  var path = slidePath.concat ($('> name', element).text ());
  return new presentation_QuizStep (
    presentation_getId ('presentation_test_step_page', path),
    $('> text',         element).text (),
    $('> position',     element).text (),
    $('> top',          element).text (),
    $('> left',         element).text (),
    $('> width',        element).text (),
    $('> height',       element).text (),
    $('> options', element).children ('option').map (
      function (i, optionElement) {
        return {
          label:     $('label', optionElement).text (),
          isCorrect: $('isCorrect', optionElement).text () === 'true',
          onSelect:  $('onSelect', optionElement).text ()
        };
    }).toArray ()
  );
}
```

The Slide Class
---------------

```javascript
/*
*/
function presentation_Slide (id, image, width, height, steps) {
  this.getId     = function () { return id; }
  this.getImage  = function () { return image; }
  this.getWidth  = function () { return width; }
  this.getHeight = function () { return height; }
  this.getSteps  = function () { return steps; }
}

/*
*/
presentation_Slide.prototype.createElement = function (elementId) {
  return new presentation_SlideElement (elementId, this);
}

/*
*/
function presentation_parseSlide (presentationPath, element) {
  var path = presentationPath.concat ($('> name', element).text ());
  return new presentation_Slide (
    presentation_getId ('presentation_slide_page', path),
    $('> image', element).text (),
    $('> width', element).text (),
    $('> height', element).text (),
    $('> steps', element).children ().map (
      function (i, stepElement) {
        var tagName = $(stepElement).prop ('tagName');
        switch (tagName) {
          case 'blankStep':
            return presentation_parseStep (path, stepElement); 
          case 'buttonStep':
            return presentation_parseButtonStep (path, stepElement);
          case 'inputStep':
            return presentation_parseInputStep (path, stepElement);
          case 'testStep':
            return presentation_parseTestStep (path, stepElement);
          default:
            strictError ('[presentation][presentation_parseSlide] Error: an error occured while parsing a slide element. "' + type + '" is an invalid slide type.');
            return null;
        }
    }).toArray () 
  );
}
```

The Presentation Class
----------------------

```javascript
/*
*/
function presentation_Presentation (id, slides) {
  this.id     = id;
  this.slides = slides;
}

/*
*/
presentation_Presentation.prototype.getSlide = function (id) {
  for (var i = 0; i < this.slides.length; i ++) {
    if (this.slides [i].getId () === id) {
      return this.slides [i];
    }
  }
  return null;
}

/*
*/
function presentation_parsePresentation (databasePath, element) {
  var path = databasePath.concat ($('> name', element).text ());
  return new presentation_Presentation (
    presentation_getId ('presentation_presentation_page', path),
    $('> slides', element).children ('slide').map (
      function (i, slideElement) {
        return presentation_parseSlide (path, slideElement);
    }).toArray ()
  );
}
```

The Database Class
------------------

```javascript
/*
*/
function presentation_Database (presentations) {
  this.presentations = presentations;
}

/*
*/
presentation_Database.prototype.getSlide = function (id) {
  for (var i = 0; i < this.presentations.length; i ++) {
    var slide = this.presentations [i].getSlide (id);
    if (slide) { return slide; }
  }
  return null;
}

/*
*/
function presentation_parseDatabase (element) {
  return new presentation_Database (
    $('presentation', element).map (
      function (i, presentationElement) {
        return presentation_parsePresentation ([], presentationElement);
    }).toArray ()
  );
}

/*
*/
function presentation_loadDatabase (url, success, failure) {
  $.ajax (url, {
    dataType: 'xml',
    success: function (doc) {
      success (presentation_parseDatabase (doc));
    },
    error: function (request, status, error) {
      strictError ('[presentation][presentation_loadDatabase] Error: an error occured while trying the load a presentation database from "' + url + '".');
      failure ();
    }
  });
}
```

The Slide Element Class
-----------------------

```javascript
/*
*/
function presentation_SlideElement (id, slide) {
  var element = $('<div></div>')
    .attr ('id', id)
    .addClass ('presentation_slide')
    .attr ('data-presentation-slide', slide.getId ())
    .css ('background-image', 'url(' + slide.getImage () + ')')
    .css ('background-size', slide.getWidth () + ', ' + slide.getHeight ())
    .css ('background-repeat', 'no-repeat')
    .css ('width', slide.getWidth ())
    .css ('height', slide.getHeight ())
    .css ('position', 'relative');

  var intro = introJs (element.get (0))
    .onafterchange (
      function () {
        intro.locked = false;
        var step = (slide.getSteps ()) [intro._currentStep]; 
        if (step) { step.onShow (intro); }
    })
    .onexit (
      function () {
        intro.locked = false;
        $('.presentation_valid', element).removeClass ('presentation_valid');
    });

  var options = {
    exitOnOverlayClick: false,
    showStepNumbers: false,
    overlayOpacity: 0.5,
    steps: []
  };

  for (var i = 0; i < slide.getSteps ().length; i ++) {
    var step = (slide.getSteps ()) [i];

    var stepElement = step.createElement (intro)
      .css ('background-image', 'url(' + slide.getImage () + ')')
      .css ('background-position', '-' + step.left + ' -' + step.top)
      .css ('background-size', slide.getWidth () + ', ' + slide.getHeight ())
      .css ('background-repeat', 'no-repeat');

    element.append (stepElement);

    options.steps.push ({
      element:  '#' + stepElement.attr ('id'),
      intro:    step.text,
      position: step.position,
    });
  }

  intro.setOptions (options)

  element.click (
    function () {
      if (!intro.running) {
        intro.start ();
      }
  });

  PAGE_LOAD_HANDLERS.add (
    function (done) {
      intro.exit ();
      done ();
  });

  this.getId = function () { return id; }

  this.getIntro = function () { return intro; }

  this.getElement = function () { return element; }
}
```

The Slide Elements Store Class
------------------------------

```javascript
/*
*/
function presentation_SlideElementsStore () {
  var self = this;

  /*
  */
  var slideElements = {};

  /*
  */
  var slideElementFunctions = {};

  /*
  */
  this.get = function (slideElementId, slideElementFunction) {
    var slideElement = slideElements [slideElementId];
    if (slideElement) {
      return slideElementFunction (slideElement);
    }
    if (!slideElementFunctions [slideElementId]) {
      slideElementFunctions [slideElementId] = [];
    }
    slideElementFunctions [slideElementId].push (slideElementFunction);
  }

  /*
  */
  this.save = function (slideElement) {
    var slideElementId = slideElement.getId ();
    if (slideElements [slideElementId]) {
      return strictError ('[presentation][presentation_SlideElementStore] Error: an error occured while trying to save a slide element. Another slide element already has the given ID.');
    }
    slideElements [slideElementId] = slideElement;

    for (var i = 0; i < slideElementFunctions [slideElementId].length; i ++) {
      (slideElementFunctions [slideElementId][i]) (slideElement);
    }
  }
};

/*
*/
var presentation_SLIDE_ELEMENTS = new presentation_SlideElementsStore ();
```

Auxiliary Functions
-------------------

```javascript
/*
*/
function presentation_getId (type, path) {
  var uri = new URI ('').segmentCoded (type);
  path.forEach (
    function (name) {
      uri.segmentCoded (name);
  });
  return uri.toString ();
}
```

The Presentation Database Schema
--------------------------------

To be considered valid, the Presentation Database XML file must conform to the following XML schema, which can be found in [database.xsd](#The Presentation Database Schema "save:").

```xml
<?xml version="1.0" encoding="utf-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <!-- Defines the root element. -->
  <xs:element name="database">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="presentation" type="presentationType" minOccurs="0" maxOccurs="unbounded">
          <xs:unique name="uniquePresentationName">
            <xs:selector xpath="presentation"/>
            <xs:field xpath="@name"/>
          </xs:unique>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>

  <!-- Defines the Presentation element type. -->
  <xs:complexType name="presentationType">
    <xs:all>
      <xs:element name="name" type="xs:string" minOccurs="1" maxOccurs="1"/>
      <xs:element name="slides" minOccurs="1" maxOccurs="1">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="slide" type="slideType" minOccurs="0" maxOccurs="unbounded">
            </xs:element>
          </xs:sequence>
        </xs:complexType>
        <xs:unique name="uniqueSlideName">
          <xs:selector xpath="slide"/>
          <xs:field xpath="name"/>
        </xs:unique>
      </xs:element>
    </xs:all>
  </xs:complexType>

  <!-- Defines the Slide element type. -->
  <xs:complexType name="slideType">
    <xs:all>
      <xs:element name="name"  type="xs:string" minOccurs="1" maxOccurs="1"/>
      <xs:element name="image" type="xs:anyURI" minOccurs="1" maxOccurs="1"/>
      <xs:element name="width" minOccurs="1" maxOccurs="1">
        <xs:simpleType>
          <xs:restriction base="xs:string">
            <xs:pattern value="[0-9]+px"/>
          </xs:restriction>
        </xs:simpleType>
      </xs:element>
      <xs:element name="height" minOccurs="1" maxOccurs="1">
        <xs:simpleType>
          <xs:restriction base="xs:string">
            <xs:pattern value="[0-9]+px"/>
          </xs:restriction>
        </xs:simpleType>
      </xs:element>
      <xs:element name="steps" type="stepsType" minOccurs="1" maxOccurs="1">
        <xs:unique name="uniqueStepName">
          <xs:selector xpath="blankStep|inputStep"/>
          <xs:field xpath="name"/>
        </xs:unique>
      </xs:element>
    </xs:all>
  </xs:complexType>

  <!-- Defines the Steps element type. -->
  <xs:complexType name="stepsType">
    <xs:choice maxOccurs="unbounded">
      <xs:element name="blankStep"  type="blankStepType" minOccurs="0"/>
      <xs:element name="buttonStep" type="blankStepType" minOccurs="0"/>
      <xs:element name="inputStep"  type="inputStepType" minOccurs="0"/>
      <xs:element name="testStep"   type="testStepType"  minOccurs="0"/>
    </xs:choice>
  </xs:complexType>

  <!-- Defines the Blank Step element type. -->
  <xs:complexType name="blankStepType">
    <xs:sequence>
      <xs:element name="name" type="xs:string" minOccurs="1" maxOccurs="1"/>
      <xs:element name="text" type="xs:string" minOccurs="1" maxOccurs="1"/>
      <xs:element name="position" minOccurs="1" maxOccurs="1">
        <xs:simpleType>
          <xs:restriction base="xs:string">
            <xs:enumeration value="bottom"/>
            <xs:enumeration value="left"/>
            <xs:enumeration value="right"/>
            <xs:enumeration value="top"/>
          </xs:restriction>
        </xs:simpleType>
      </xs:element>
      <xs:element name="top" minOccurs="1" maxOccurs="1">
        <xs:simpleType>
          <xs:restriction base="xs:string">
            <xs:pattern value="[0-9]+px"/>
          </xs:restriction>
        </xs:simpleType>
      </xs:element>
      <xs:element name="left" minOccurs="1" maxOccurs="1">
        <xs:simpleType>
          <xs:restriction base="xs:string">
            <xs:pattern value="[0-9]+px"/>
          </xs:restriction>
        </xs:simpleType>
      </xs:element>
      <xs:element name="width" minOccurs="1" maxOccurs="1">
        <xs:simpleType>
          <xs:restriction base="xs:string">
            <xs:pattern value="[0-9]+px"/>
          </xs:restriction>
        </xs:simpleType>
      </xs:element>
      <xs:element name="height" minOccurs="1" maxOccurs="1">
        <xs:simpleType>
          <xs:restriction base="xs:string">
            <xs:pattern value="[0-9]+px"/>
          </xs:restriction>
        </xs:simpleType>
      </xs:element>
    </xs:sequence>
  </xs:complexType>

  <!-- Defines the Input Step element type. -->
  <xs:complexType name="inputStepType">
    <xs:complexContent>
      <xs:extension base="blankStepType">
        <xs:sequence>
          <xs:element name="expression" type="xs:string" minOccurs="1" maxOccurs="1"/>
        </xs:sequence>
      </xs:extension>
    </xs:complexContent>
  </xs:complexType>

  <!-- Defines the Test Step element type. -->
  <xs:complexType name="testStepType">
    <xs:complexContent>
      <xs:extension base="blankStepType">
        <xs:sequence>
          <xs:element name="options" type="optionsType" minOccurs="1" maxOccurs="1"/>
        </xs:sequence>
      </xs:extension>
    </xs:complexContent>
  </xs:complexType>

  <!-- Defines the Options element type. -->
  <xs:complexType name="optionsType">
    <xs:sequence>
      <xs:element name="option" minOccurs="0" maxOccurs="unbounded">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="label" type="xs:string" minOccurs="1" maxOccurs="1"/>
            <xs:element name="isCorrect" minOccurs="1" maxOccurs="1">
              <xs:simpleType>
                <xs:restriction base="xs:string">
                  <xs:enumeration value="true"/>
                  <xs:enumeration value="false"/>
                </xs:restriction>
              </xs:simpleType>
            </xs:element>
            <xs:element name="onSelect" type="xs:string" minOccurs="1" maxOccurs="1"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:sequence>
  </xs:complexType>
</xs:schema>
```

An Example Presentation Database
--------------------------------

An example Presentation Database can be found in [database.xml.example](#An Example Presentation Database "save:") and is presented below:

```xml
<?xml version="1.0" encoding="utf-8"?>
<database>
  <presentation>
    <name>Example Presentation</name>
    <slides>
      <slide>
        <name>Example Slide</name>
        <image>https://www.wikipedia.org/portal/wikipedia.org/assets/img/Wikipedia-logo-v2.png</image>
        <width>500px</width>
        <height>500px</height>
        <steps>
          <blankStep>
            <name>First Step</name>
            <text><![CDATA[<p>This is an example blank step.</p>]]></text>
            <position>top</position>
            <top>10%</top>
            <left>10%</left>
            <width>100px</width>
            <height>100px</height>
          </blankStep>
          <inputStep>
            <name>Second Step</name>
            <text><![CDATA[<p>This is an example input step.</p>]]></text>
            <position>top</position>
            <top>10%</top>
            <left>10%</left>
            <width>100px</width>
            <height>100px</height>
            <expression><![CDATA[\d+\.\d{2}]]></expression>
          </inputStep>
          <testStep>
            <name>Third Step</name>
            <text><![CDATA[<p>This is an example test.</p>]]></text>
            <position>top</position>
            <top>10%</top>
            <left>10%</left>
            <width>100px</width>
            <height>100px</height>
            <options>
              <option>
                <label><![CDATA[First option]]></label>
                <isCorrect>true</isCorrect>
                <onSelect><![CDATA[Correct!]]></onSelect>
              </option>
              <option>
                <label><![CDATA[Second option]]></label>
                <isCorrect>false</isCorrect>
                <onSelect><![CDATA[Incorrect!]]></onSelect>
              </option>
            </options>
          </testStep>
        </steps>
      </slide>
    </slides>
  </presentation>
</database>
```

The Default Presentation Database
---------------------------------

The default Presentation Database contains an empty database and can be found in [database.xml.default](#The Default Presentation Database "save:").

```xml
<?xml version="1.0" encoding="utf-8"?>
<database></database>
```

Generating Source Files
-----------------------

You can generate the Book module's source files using [Literate Programming](https://github.com/jostylr/literate-programming), simply execute:
`literate-programming Readme.md`
from the command line.

<!---
### Presentation.js
```
_"Global Variables"

_"The Load Event Handler"

_"The Block Handlers"

_"The Step Class"

_"The Button Step Class"

_"The Input Step Class"

_"The Quiz Step Class"

_"The Slide Class"

_"The Presentation Class"

_"The Database Class"

_"The Slide Element Class"

_"The Slide Elements Store Class"

_"Auxiliary Functions"
```
[presentation.js](#Presentation.js "save:")
-->
