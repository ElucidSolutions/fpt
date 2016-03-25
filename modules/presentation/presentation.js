/*
*/
var presentation_DATABASE_URL = 'modules/presentation/database.xml';

/*
*/
var presentation_DATABASE = {};

/*
*/
MODULE_LOAD_HANDLERS.add (
  function (done) {
    // I. Load the Intro.JS library.
    loadScript ('modules/presentation/lib/intro.js-2.0.0/intro.js',
      function (error) {
        if (error) { return done (error); }

        // II. Load the Presentation database.
        presentation_loadDatabase (
          presentation_DATABASE_URL,
          function (error, database) {
            if (error) { return done (error); }

            // III. Cache the Presentation database.
            presentation_DATABASE = database;

            // IV. Register the block handlers.
            block_HANDLERS.add ('presentation_block', presentation_block);

            // V. Continue.
            done (null);
        });
  });
});

/*
*/
function presentation_block (context, done) {
  var presentationElementId = context.element.attr ('id');
  if (!presentationElementId) {
    presentationElementId = getUniqueId ();
  }

  var presentationElement = presentation_DATABASE.getPresentation (context.element.text ()).createElement (presentationElementId);
  presentation_SLIDE_ELEMENTS.save (presentationElement);

  var element = presentationElement.element;
  context.element.replaceWith (element);
  done (null, element);
}

/*
*/
function presentation_Step (id, image, text, position, top, left, width, height) {
  this.id        = id;
  this.image     = image;
  this.text      = text;
  this.position  = position;
  this.top       = top;
  this.left      = left;
  this.width     = width;
  this.height    = height;
}

/*
*/
presentation_Step.prototype.createElement = function (intro, oncomplete) {
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
// function presentation_parseStep (presentationPath, element) {}

/*
*/
function presentation_ButtonStep (id, image, text, position, top, left, width, height) {
  presentation_Step.call (this, id, image, text, position, top, left, width, height);
}

/*
*/
presentation_ButtonStep.prototype = Object.create (presentation_Step.prototype);

/*
*/
presentation_ButtonStep.prototype.constructor = presentation_ButtonStep;

/*
*/
presentation_ButtonStep.prototype.createElement = function (intro, oncomplete) {
  var self = this;
  return presentation_Step.prototype.createElement.call (this, intro)
    .addClass ('presentation_button_step')
    .click (
      function (event) {
        event.stopPropagation ();
        oncomplete (function () {
          intro.nextStep ();
        });
     });
}

/*
*/
function presentation_parseButtonStep (presentationPath, element) {
  var path = presentationPath.concat ($('> name', element).text ());
  return new presentation_ButtonStep (
    presentation_getId ('presentation_step_page', path),
    $('> image',    element).text (),
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
function presentation_InputStep (id, image, text, position, top, left, width, height, expression) {
  presentation_Step.call (this, id, image, text, position, top, left, width, height);
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
presentation_InputStep.prototype.createElement = function (intro, oncomplete) {
  var element = presentation_Step.prototype.createElement.call (this, intro)
    .addClass ('presentation_input_step');

  var self = this;
  var inputElement = $('<input></input>')
    .attr ('type', 'text')
    .keyup (
      function () {
        if (self.checkInput (inputElement)) {
          element.addClass ('presentation_valid')
            .removeClass ('presentation_invalid');
          oncomplete (function () {});
        } else {
          element.removeClass ('presentation_valid')
            .addClass ('presentation_invalid');
        }
    });

  element.append (inputElement);
  return element;
}

/*
*/
function presentation_parseInputStep (presentationPath, element) {
  var path = presentationPath.concat ($('> name', element).text ());
  return new presentation_InputStep (
    presentation_getId ('presentation_input_step_page', path),
    $('> image',        element).text (),
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
function presentation_QuizStep (id, image, text, position, top, left, width, height, options) {
  presentation_Step.call (this, id, image, text, position, top, left, width, height);
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
presentation_QuizStep.prototype.onClick = function (stepElement, oncomplete) {
  var optionsElement = $('.presentation_options', stepElement);

  var selectedOption = this.getSelectedOption (optionsElement);
  $('.presentation_message', stepElement).text (selectedOption.onSelect);

  if (this.checkInput (optionsElement)) {
     stepElement.addClass ('presentation_valid')
       .removeClass ('presentation_invalid');
     oncomplete (function () {});
  } else {
     stepElement.removeClass ('presentation_valid')
       .addClass ('presentation_invalid');
  }
}

/*
*/
presentation_QuizStep.prototype.createElement = function (intro, oncomplete) {
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
              self.onClick (element, oncomplete);
          }))
        .append ($('<label></label>')
          .addClass ('presentation_option_label')
          .text (option.label)));
  }
  return element;
}

/*
*/
function presentation_parseTestStep (presentationPath, element) {
  var path = presentationPath.concat ($('> name', element).text ());
  return new presentation_QuizStep (
    presentation_getId ('presentation_test_step_page', path),
    $('> image',        element).text (),
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
function presentation_Presentation (id, image, width, height, steps) {
  this.getId     = function () { return id; }
  this.getImage  = function () { return image; }
  this.getWidth  = function () { return width; }
  this.getHeight = function () { return height; }
  this.getSteps  = function () { return steps; }
}

/*
*/
presentation_Presentation.prototype.createElement = function (elementId) {
  return new presentation_PresentationElement (elementId, this);
}

/*
*/
function presentation_parsePresentation (presentationPath, element) {
  var path = presentationPath.concat ($('> name', element).text ());
  return new presentation_Presentation (
    presentation_getId ('presentation', path),
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
            strictError ('[presentation][presentation_parsePresentation] Error: an error occured while parsing a presentation element. "' + type + '" is an invalid presentation type.');
            return null;
        }
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
presentation_Database.prototype.getPresentation = function (id) {
  for (var i = 0; i < this.presentations.length; i ++) {
    var presentation = this.presentations [i];
    if (presentation.getId () === id) { return presentation; }
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
function presentation_loadDatabase (url, done) {
  $.ajax (url, {
    dataType: 'xml',
    success: function (doc) {
      done (null, presentation_parseDatabase (doc));
    },
    error: function (request, status, errorMsg) {
      var error = new Error ('[presentation][presentation_loadDatabase] Error: an error occured while trying the load a presentation database from "' + url + '".');
      strictError (error);
      done (error);
    }
  });
}

/*
*/
function presentation_StepElement (intro, step) {
  var stepElement = this;

  // Indicates whether or not this step has been completed.
  var _completed = false;

  // Returns true iff this step has been completed.
  this.completed = function () { return _completed; }

  /*
    An array of oncomplete event handlers. Every
    oncomplete event handler accepts one
    argument: next, a function that accepts
    an Error.
  */
  var _oncomplete = [];

  /*
    Accepts one argument:

    * handler, a function that accepts one
      argument: next, a function that, in turn,
      accepts an Error object.

    and adds handler to the list of oncomplete
    event handlers.
  */
  this.oncomplete = function (handler) {
    _oncomplete.push (handler);
  }

  /*
    Accepts one argument:

    * done, a function that accepts one argument:
    error, an Error object

    marks this step as complete and executes
    the oncomplete event handlers. If any
    of the handlers pass an error to their
    continuations, this function passes the
    error to done and returns immediately.
  */
  this.complete = function (done) {
    // Marks this step as completed.
    _completed = true;

    // Executes the oncomplete event handlers.
    async.series (_oncomplete, done);
  }

  /*
    A JQuery HTML element that represents this step.
  */
  this.element = step.createElement (intro, this.complete);
}

/*
*/
function presentation_NavElement (intro, stepElements) {
  var self = this;

  // The JQuery HTML Element that represents this nav element.
  this.element = $('<table></table>')
    .addClass ('presentation_nav')
    .append ($('<tbody></tbody>')
      .append ($('<tr></tr>')
        .append ($('<td>BACK</td>')
            .addClass ('presentation_nav_back')
            .addClass ('presentation_disabled')
            .click (function (event) {
                event.stopPropagation ();
                intro._currentStep > 0 && intro.previousStep ();
              }))
        .append (stepElements.map (function (stepElement, i) {
            return $('<td>' + (i + 1) + '</td>')
              .addClass ('presentation_nav_step')
              .addClass (i === 0 ? 'presentation_current_step' : 'presentation_disabled')
              .attr ('data-presentation-nav-step', i)
              .click (function (event) {
                  event.stopPropagation ();
                  (i === 0 || stepElements [i - 1].completed ()) && intro.goToStep (i + 1);
                });
          }))
        .append ($('<td>NEXT</td>')
            .addClass ('presentation_nav_next')
            .addClass (stepElements.length === 0 || stepElements [0].completed () ? '' : 'presentation_disabled')
            .click (function (event) {
                event.stopPropagation ();
                stepElements [intro._currentStep].completed () && 
                  (intro._currentStep < stepElements.length - 1 ?
                    intro.nextStep ():
                    intro.exit ());
              }))));

  /*
    Updates the nav element to reflect the
    current state.
  */
  this.refresh = function () {
    // I. Enable/disable the Back button.
    var backElement = $('.presentation_nav_back', self.element);
    intro._currentStep === 0 ?
      backElement.addClass    ('presentation_disabled'):
      backElement.removeClass ('presentation_disabled');

    // II. Enable/disable the step buttons.
    for (var i = 0; i < stepElements.length; i ++) {
      var stepElement = $('[data-presentation-nav-step="' + i + '"]', self.element);
      (i === 0 || stepElements [i - 1].completed ()) ?
        stepElement.removeClass ('presentation_disabled'):
        stepElement.addClass    ('presentation_disabled');
    }

    // III. Highlight the current step button.
    $('.presentation_nav_step', self.element).removeClass ('presentation_current_step');
    $('[data-presentation-nav-step="' + intro._currentStep + '"]', self.element).addClass ('presentation_current_step');

    // IV. Enable/disable the Next button.
    var nextElement = $('.presentation_nav_next', self.element);
    stepElements [intro._currentStep].completed () ?
      nextElement.removeClass ('presentation_disabled'):
      nextElement.addClass    ('presentation_disabled');
  }

  // Register oncomplete event handlers.
  for (var i = 0; i < stepElements.length; i ++) {
    stepElements [i].oncomplete (
      function (done) {
        self.refresh ();
        done (null);
    });
  }
}

/*
*/
function presentation_PresentationElement (id, presentation) {
  var self = this;

  // Returns this presentation element's HTML element ID.
  this.id = function () { return id; }

  // The JQuery HTML Element that represents this presentation element.
  this.element = $('<div></div>')
    .attr ('id', id)
    .addClass ('presentation_presentation')
    .attr ('data-presentation-presentation', presentation.getId ())
    .css ('background-image',  'url(' + presentation.getImage () + ')')
    .css ('background-size',   presentation.getWidth () + ', ' + presentation.getHeight ())
    .css ('background-repeat', 'no-repeat')
    .css ('width',             presentation.getWidth ())
    .css ('height',            presentation.getHeight ())
    .css ('position',          'relative');

  // The IntroJS object associated with this presentation element.
  this.intro = introJs (this.element.get (0));

  // The default IntroJS settings.
  var introOptions = {
    keyboardNavigation: false,
    exitOnOverlayClick: false,
    showStepNumbers: true,
    showButtons: false,
    showBullets: false,
    overlayOpacity: 0.5,
    steps: []
  };

  // The Steps associated with the presentation.
  var steps = presentation.getSteps ();

  // The step elements associated with this presentation element.
  var stepElements = [];

  for (var i = 0; i < steps.length; i ++) {
    var step = steps [i];

    var stepElement = new presentation_StepElement (this.intro, step);
    stepElements.push (stepElement);

    this.element.append (stepElement.element
      .css ('background-image',    'url(' + step.image + ')')
      .css ('background-position', '-' + step.left + ' -' + step.top)
      .css ('background-size',     presentation.getWidth () + ', ' + presentation.getHeight ())
      .css ('background-repeat',   'no-repeat'));

    introOptions.steps.push ({
      element:  '#' + stepElement.element.attr ('id'),
      intro:    step.text,
      position: step.position,
    });
  }

  // The nav element associated with this presentation element.
  var navElement = new presentation_NavElement (this.intro, stepElements);

  this.intro.setOptions (introOptions)
    .onafterchange (
        function () {
          if ($('.presentation_nav', self.element).length === 0) {
            $('.introjs-tooltip', self.element)
              .prepend ($('<div class="presentation_exit"></div>')
                  .click (function (event) {
                      event.stopPropagation ();
                      self.intro.exit ();
                }))
              .append (navElement.element);
          }
          navElement.refresh ();

          var currentStep = steps [self.intro._currentStep];
          self.element.css ('background-image', 'url(' + currentStep.image + ')');
      })
    .oncomplete (
        function () {
          self.element.css ('background-image', 'url(' + presentation.getImage () + ')');
      });

  this.element.click (
    function () {
      self.intro.running || self.intro.start ();
  });

  PAGE_LOAD_HANDLERS.add (
    function (id, done) {
      self.intro.exit ();
      done (null);
  });
}

/*
*/
function presentation_PresentationElementsStore () {
  var self = this;

  /*
  */
  var presentationElements = {};

  /*
  */
  var presentationElementFunctions = {};

  /*
  */
  this.get = function (presentationElementId, presentationElementFunction) {
    var presentationElement = presentationElements [presentationElementId];
    if (presentationElement) {
      return presentationElementFunction (presentationElement);
    }
    if (!presentationElementFunctions [presentationElementId]) {
      presentationElementFunctions [presentationElementId] = [];
    }
    presentationElementFunctions [presentationElementId].push (presentationElementFunction);
  }

  /*
  */
  this.save = function (presentationElement) {
    var presentationElementId = presentationElement.id ();
    if (presentationElements [presentationElementId]) {
      strictError (new Error ('[presentation][presentation_PresentationElementStore] Error: an error occured while trying to save a presentation element. Another presentation element already has the given ID.'));
      return null;
    }
    presentationElements [presentationElementId] = presentationElement;

    if (!presentationElementFunctions [presentationElementId]) {
      presentationElementFunctions [presentationElementId] = [];
    }
    for (var i = 0; i < presentationElementFunctions [presentationElementId].length; i ++) {
      (presentationElementFunctions [presentationElementId][i]) (presentationElement);
    }
  }
};

/*
*/
var presentation_SLIDE_ELEMENTS = new presentation_PresentationElementsStore ();

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