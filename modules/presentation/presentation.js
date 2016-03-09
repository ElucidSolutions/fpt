/*
*/
var presentation_DATABASE_URL = 'modules/presentation/database.xml';

/*
*/
var presentation_DATABASE = {};

/*
*/
registerModule (
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
            registerBlockHandler ('presentation_slide_block', presentation_slideBlock);

            // VI. Continue.
            done ();
          },
          function () {}
        );
  });
});

/*
*/
function presentation_slideBlock (blockElement, success, failure) {
  var element = presentation_DATABASE.getSlide (blockElement.text ()).getElement ();
  blockElement.replaceWith (element);
  success (element);
}

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

/*
*/
function presentation_Slide (id, image, width, height, steps) {
  var intro = null;
  var introFunctions = [];
  var element = null;

  this.getId = function () { return id; };
  this.getSteps = function () { return steps; };

  /*
    Accepts one argument: f, a function that
    accepts an IntroJS object; and either passes
    this slide's IntroJS object to f or saves
    f as a deferred function.

    Note: When this slide's IntroJS object
    is created by getElement, these deferred
    functions are executed.
  */
  this.getIntro = function (f) {
    if (intro) { return f (intro); }
    introFunctions.push (f);
  };

  /*
    Returns this slide's HTML element as a JQuery
    HTML Element.

    Note: This function sets this slide's IntroJS
    object and executes any deferred functions
    stored in introFunctions.
  */
  this.getElement = function () {
    if (element) { return element; }

    element = $('<div></div>')
      .addClass ('presentation_slide')
      .attr ('data-presentation-slide', id)
      .css ('background-image', 'url(' + image + ')')
      .css ('background-size', width + ', ' + height)
      .css ('background-repeat', 'no-repeat')
      .css ('width', width)
      .css ('height', height)
      .css ('position', 'relative');

    intro = introJs (element.get (0))
      .onafterchange (
        function () {
          intro.locked = false;
          var step = steps [intro._currentStep]; 
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

    for (var i = 0; i < steps.length; i ++) {
      var step = steps [i];

      var stepElement = step.createElement (intro)
        .css ('background-image', 'url(' + image + ')')
        .css ('background-position', '-' + step.left + ' -' + step.top)
        .css ('background-size', width + ', ' + height)
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

    PAGE_LOAD_HANDLERS.push (
      function (done) {
        intro.exit ();
        done ();
    });

    for (var i = 0; i < introFunctions.length; i ++) {
      (introFunctions [i]) (intro);
    }

    return element;
  };
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