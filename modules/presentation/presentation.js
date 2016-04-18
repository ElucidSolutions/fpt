/*
  A URL string that represents the presentation
  database URL.
*/
var presentation_DATABASE_URL = 'modules/presentation/database.xml';

/*
  A presentation_Database object that represents
  the current presentation database.
*/
var presentation_DATABASE = {};

/*
  A boolean variable indicating whether or not
  audio narration is enabled.
*/
var presentation_AUDIO = false;

// The module's load event handler.
MODULE_LOAD_HANDLERS.add (
  function (done) {
    // I. Load the external libraries.
    loadScripts ([
        'modules/presentation/lib/intro/intro.js-2.0.0/intro.js',
        'modules/presentation/lib/materialize/materialize-0.97.6/js/bin/materialize.js',
        'http://code.responsivevoice.org/responsivevoice.js'
      ],
      function (error) {
        if (error) { return done (error); }

        // II. Load the Materialize stylesheet.
        $.getCSS ('modules/presentation/lib/materialize/materialize-0.97.6/css/materialize.css');

        // III. Load the Presentation database.
        presentation_loadDatabase (
          presentation_DATABASE_URL,
          function (error, database) {
            if (error) { return done (error); }

            // IV. Cache the Presentation database.
            presentation_DATABASE = database;

            // V. Register the block handlers.
            block_HANDLERS.add ('presentation_block', presentation_block);

            // VI. Cancel text to speech playback on page load.
            PAGE_LOAD_HANDLERS.add (
              function (id, done) {
                responsiveVoice.cancel ();
                done ();
            });

            // VII. Continue.
            done (null);
        });      
  });
});

/*
  Accepts two arguments:

  * context, a Block Expansion Context
  * and done, a function that accepts one
    argument: error, an Error

  context.element must contain a single text
  node representing a presentation ID.

  replaces context.element with a JQuery
  HTML Element that represents the referenced
  presentation and calls done.
*/
function presentation_block (context, done) {
  var presentation = presentation_DATABASE.getPresentation (context.element.text ());
  if (!presentation) { return done (null, null); }

  presentationElement = new presentation_PresentationElement (presentation);

  var element = presentationElement.element;
  context.element.replaceWith (element);
  done (null, null);
}

/*
  Accepts eight arguments:

  * id, an Presentation Step ID string
  * image, a URL string
  * text, an HTML string
  * position, a string equal to either "top",
    "bottom", "left", "right", or other positions
    defined by IntroJS.
  * top, a CSS Dimension string
  * left, a CSS Dimension string
  * width, a CSS Dimension string
  * and height, a CSS Dimension string

  and returns a presentation_Step that whose
  background image is given by image, main prompt
  equals text, whose focus element is positioned
  by top and left, whose dimensions are given
  by width and height, and whose main prompt is
  positioned near the focus element according
  to position.
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

// Accepts no arguments and reads this step's text aloud.
presentation_Step.prototype.speak = function () {
  presentation_speak (this.text);
}

/*
  Accepts no arguments and returns a JQuery
  HTML element that represents this step's
  focus element.
*/
presentation_Step.prototype._createElement = function () {
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
  Accepts two arguments:

  * presentationElement, a presentation_Element
  * and stepElement, a presentation_StepElement

  and returns a JQuery HTML Element that
  represents this step's focus element.
*/
presentation_Step.prototype.createElement = function (presentationElement, stepElement) {}

/*
  Accepts two arguments:

  * presentationElement, a presentation_Element
  * and stepElement, a presentation_StepElement.

  stepElement must be one of this step's
  instances and presentationElement must include
  stepElement as one of its step elements.

  This function marks the stepElement as having
  been completed and updates the nav element
  associated with presentationElement.

  This function should be called when a user
  completes stepElement.
*/
presentation_Step.prototype.complete = function (presentationElement, stepElement) {
  stepElement.completed = true;
  presentation_updateNavElement (presentationElement.intro, presentationElement.stepElements, presentationElement.navElement);
}

/*
  Accepts two arguments:

  * presentationElement, a presentation_Element
  * and stepElement, a presentation_StepElement.

  stepElement must be one of this step's
  instances and presentationElement must include
  stepElement as one of its step elements.

  This function updates presentationElement and
  stepElement.

  This function should be called when introJS
  highlights stepElement - i.e. when stepElement
  is presented to the user.
*/
presentation_Step.prototype.onHighlight = function (presentationElement, stepElement) {}

/*
  Accepts two arguments:

  * presentationPath, a string array
  * and element, a JQuery HTML Element.

  element must represent a Presentation Step
  Database Entry element.

  presentationPath must be a path giving this
  presentation's location within the database
  containing element.

  This function returns the step represented by
  element as a presentation_Step.
*/
function presentation_parseStep (presentationPath, element) {}

/*
*/
function presentation_BlankStep (id, image, text, position, top, left, width, height) {
  presentation_Step.call (this, id, image, text, position, top, left, width, height);
}

/*
*/
presentation_BlankStep.prototype = Object.create (presentation_Step.prototype);

/*
*/
presentation_BlankStep.prototype.constructor = presentation_ButtonStep;

/*
*/
presentation_BlankStep.prototype.createElement = function (presentationElement, stepElement) {
  return this._createElement.call (this).addClass ('presentation_blank_step');
}

/*
*/
presentation_BlankStep.prototype.onHighlight = function (presentationElement, stepElement) {
  this.complete (presentationElement, stepElement);
}

/*
*/
function presentation_parseBlankStep (presentationPath, element) {
  var path = presentationPath.concat ($('> name', element).text ());
  return new presentation_BlankStep (
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
presentation_ButtonStep.prototype.createElement = function (presentationElement, stepElement) {
  var self = this;

  var element = presentation_Step.prototype._createElement.call (this);
  return element
    .addClass ('presentation_button_step')
    .keydown (function (event) {
        element.attr ('tabindex', -1);
        event.keyCode === 13 && self.complete (presentationElement, stepElement);
      })
    .click (function (event) {
        event.stopPropagation ();
        element.attr ('tabindex', -1);
        self.complete (presentationElement, stepElement);
     });
}

/*
*/
presentation_ButtonStep.prototype.complete = function (presentationElement, stepElement) {
  presentation_Step.prototype.complete.call (this, presentationElement, stepElement);
  presentationElement.intro.nextStep ();
}

/*
*/
presentation_ButtonStep.prototype.onHighlight = function (presentationElement, stepElement) {
  stepElement.element.attr ('tabindex', 0);
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
function presentation_InputStep (id, image, text, position, top, left, width, height, expression, errorAlert) {
  presentation_Step.call (this, id, image, text, position, top, left, width, height);
  this.expression = expression;
  this.errorAlert = errorAlert;
}

/*
*/
presentation_InputStep.prototype = Object.create (presentation_Step.prototype);

/*
*/
presentation_InputStep.prototype.constructor = presentation_InputStep;

/*
*/
presentation_InputStep.prototype.checkInput = function (input) {
  var expression = new RegExp (this.expression);
  return expression.test (input);
}

/*
*/
presentation_InputStep.prototype.createElement = function (presentationElement, stepElement) {
  var self = this;

  var element = presentation_Step.prototype._createElement.call (this)
    .addClass ('presentation_input_step');

  var inputElement = $('<input></input>')
    .attr ('type', 'text')
    .attr ('tabindex', -1)
    .keyup (
      function (event) {
        if (event.keyCode === 13) {
          if (self.checkInput (inputElement.val ())) {
            element
              .addClass ('presentation_valid')
              .removeClass ('presentation_invalid');

            stepElement.message = null;
            $('.presentation_error_message', presentationElement.element).hide ().empty ();

            presentation_AUDIO && presentation_speak ('correct');

            inputElement.attr ('tabindex', -1);
            self.complete (presentationElement, stepElement);
          } else {
            element
              .removeClass ('presentation_valid')
              .addClass ('presentation_invalid');

            stepElement.message = self.errorAlert;
            $('.presentation_error_message', presentationElement.element).html (self.errorAlert).show ();

            presentation_AUDIO && presentation_speak ($('<p>incorrect.</p>').append (self.errorAlert).text ());
          }
        }
    });

  element.append (inputElement);
  return element;
}

/*
*/
presentation_InputStep.prototype.onHighlight = function (presentationElement, stepElement) {
  var input = $('input', stepElement.element).attr ('tabindex', 0).val ();
  input && (this.checkInput (input) || $('.presentation_error_message', presentationElement.element).html (this.errorAlert).show ());
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
    $('> expression',   element).text (),
    $('> errorAlert',   element).text ()
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
presentation_QuizStep.prototype.speak = function () {
  presentation_speak ($('<p></p>')
    .append (this.text)
    .append ($('<p>options.</p>')
      .append (this.options.map (
        function (option) {
          return option.label;
        })))
  );
}

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
presentation_QuizStep.prototype.onClick = function (focusElement, presentationElement, stepElement) {
  var optionsElement = $('.presentation_options', focusElement);

  var selectedOption = this.getSelectedOption (optionsElement);
  $('.presentation_message', focusElement).text (selectedOption.onSelect);

  if (this.checkInput (optionsElement)) {
    focusElement
      .addClass ('presentation_valid')
      .removeClass ('presentation_invalid');

    presentation_AUDIO && presentation_speak ('correct.')

    this.complete (presentationElement, stepElement);
  } else {
    focusElement
      .removeClass ('presentation_valid')
      .addClass ('presentation_invalid');

    presentation_AUDIO && presentation_speak ('incorrect.')
  }
}

/*
*/
presentation_QuizStep.prototype.onHighlight = function (presentationElement, stepElement) {}

/*
*/
presentation_QuizStep.prototype.createElement = function (presentationElement, stepElement) {
  var element = presentation_Step.prototype._createElement.call (this)
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
              self.onClick (element, presentationElement, stepElement);
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
            return presentation_parseBlankStep (path, stepElement); 
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
function presentation_StepElement (presentationElement, step) {
  /*
  */
  this.step = step;

  /*
  */
  this.completed = false;

  /*
  */
  this.spoken = false;

  /*
  */
  this.speak = function () {
    step.speak ();
    this.spoken = true;
  }

  /*
  */
  this.element = step.createElement (presentationElement, this);

  /*
  */
  this.onHighlight = function () {
    step.onHighlight (presentationElement, this);
  }
}

/*
*/
function presentation_PresentationElement (presentation) {
  var self = this;

  var _onComplete = [];
  
  this.onComplete = function (handler) { _onComplete.push (handler); }

  // The JQuery HTML Element that represents this presentation element.
  this.element = presentation_createPresentationElement (presentation);

  // The IntroJS object associated with this presentation element.
  this.intro = introJs (this.element.get (0));

  // The default IntroJS settings.
  var introOptions = {
    keyboardNavigation: false,
    exitOnOverlayClick: false,
    showStepNumbers: true,
    showButtons: false,
    showBullets: false,
    overlayOpacity: 0.4,
    steps: []
  };

  // The Steps associated with the presentation.
  var steps = presentation.getSteps ();

  // The step elements associated with this presentation element.
  this.stepElements = [];

  for (var i = 0; i < steps.length; i ++) {
    var step = steps [i];
    var stepElement = new presentation_StepElement (this, step);
    this.stepElements.push (stepElement);

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
  this.navElement = presentation_createNavElement (this.intro, this.stepElements);

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
              .append ($('<div></div>').addClass ('presentation_error_message'))
              .append (presentation_createAudioToggleElement (self))
              .append (self.navElement);
          }
          presentation_updateNavElement (self.intro, self.stepElements, self.navElement);

          $('.presentation_error_message', self.element).hide ().empty ();

          var stepElement = self.stepElements [self.intro._currentStep];
          stepElement.onHighlight ();

          stepElement.spoken = false;
          presentation_AUDIO && stepElement.speak ();

          var step = stepElement.step;
          self.element.css ('background-image', 'url(' + step.image + ')');
      })
    .onexit (
        function () {
          responsiveVoice.cancel ();

          self.element.css ('background-image', 'url(' + presentation.getImage () + ')');
          self.element.removeClass ('presentation_active');
          $('.introjs-tooltip').remove ();

          self.element
            .append (presentation_createOverlayInsetElement ('REPLAY LESSON', 'modules/presentation/images/replay-icon.png'))
            .append (presentation_createOverlayElement ());
      })
    .oncomplete (
        function () {
          async.series (_onComplete);
      });

  this.element.click (
    function () {
      if (!self.intro.running) {
        self.intro.start ();
        self.element.addClass ('presentation_active');
        $('.presentation_overlay_inset', self.element).remove ();
        $('.presentation_overlay', self.element).remove ();
        var stepElement = self.stepElements [0];
        stepElement.onHighlight ();
      }
  });

  PAGE_LOAD_HANDLERS.add (
    function (id, done) {
      self.intro.exit ();
      done (null);
  });
}

/*
*/
function presentation_createNavElement (intro, stepElements) {
  return $('<table></table>')
    .addClass ('presentation_nav')
    .append ($('<tbody></tbody>')
      .append ($('<tr></tr>')
        .append ($('<td>BACK</td>')
            .attr ('tabindex', 0)
            .addClass ('presentation_nav_back')
            .addClass ('presentation_disabled')
            .keydown (function (event) {
                event.keyCode === 13 && intro._currentStep > 0 && intro.previousStep ();
              })
            .click (function (event) {
                event.stopPropagation ();
                intro._currentStep > 0 && intro.previousStep ();
              }))
        .append ($('<td>Step <span class="presentation_nav_step">1</span> of <span class="presentation_nav_total">' + stepElements.length + '</span></td>'))
        .append ($('<td>NEXT</td>')
            .attr ('tabindex', 0)
            .addClass ('presentation_nav_next')
            .addClass (stepElements.length === 0 || stepElements [0].completed ? '' : 'presentation_disabled')
            .keydown (function (event) {
                event.keyCode === 13 && stepElements [intro._currentStep].completed && intro.nextStep ();
              })
            .click (function (event) {
                event.stopPropagation ();
                stepElements [intro._currentStep].completed && intro.nextStep ();
              }))));
}

/*
*/
function presentation_updateNavElement (intro, stepElements, navElement) {
  // I. Enable/disable the Back button.
  var backElement = $('.presentation_nav_back', navElement);
  intro._currentStep === 0 ?
    backElement.addClass    ('presentation_disabled'):
    backElement.removeClass ('presentation_disabled');

  // II. Enable/disable the step buttons.
  $('.presentation_nav_step', navElement).text (intro._currentStep + 1);

  // III. Highlight the current step button.
  $('.presentation_nav_step', navElement).removeClass ('presentation_current_step');
  $('[data-presentation-nav-step="' + intro._currentStep + '"]', navElement).addClass ('presentation_current_step');

  // IV. Enable/disable the Next button.
  var nextElement = $('.presentation_nav_next', navElement);
  stepElements [intro._currentStep].completed ?
    nextElement.removeClass ('presentation_disabled'):
    nextElement.addClass    ('presentation_disabled');

  // V. Label the Next button.
  intro._currentStep < stepElements.length - 1 ?
    nextElement.text ('NEXT').removeClass ('presentation_complete'):
    nextElement.text ('DONE').addClass ('presentation_complete');
}

/*
*/
function presentation_createOverlayInsetElement (label, icon) {
  return $('<div></div>')
    .addClass ('presentation_overlay_inset')
    .css ({
      'cursor':   'pointer',
      'height':   '168px',
      'left':     '416px',
      'opacity':  '1',
      'position': 'absolute',
      'top':      '165px',
      'width':    '168px',
      'z-index':  '1011'
    })
    .append ($('<div></div>')
      .addClass ('presentation_overlay_inset_icon')
      .css ({
        'background-image':    'url(' + icon + ')',
        'background-repeat':   'no-repeat',
        'background-position': '50%',
        'height':              '100px',
        'width':               '100%'
      }))
    .append ($('<div></div>')
      .addClass ('presentation_overlay_inset_text')
      .css ({
        'height':     '68px',
        'text-align': 'center',
        'width':      '100%'
      })
      .append ($('<p></p>').text (label).css ('color', 'white'))
    );
}

/*
*/
function presentation_createOverlayElement () {
  return $('<div></div>')
    .addClass ('presentation_overlay')
    .css ({
        'background-color':    'black',
        'height':              '100%',
        'cursor':               'pointer',
        'opacity':             '0.4',
        'position':            'absolute',
        'top':                 '0px',
        'width':               '100%',
        'z-index':             '1010'
      });
}

/*
*/
function presentation_createPresentationElement (presentation) {
  var icon = 'modules/presentation/images/play-circle-outline.png';
  var label = 'PLAY LESSON';
  return $('<div></div>')
    .addClass ('presentation_presentation')
    .attr ('data-presentation-presentation', presentation.getId ())
    .css ('background-image',  'url(' + presentation.getImage () + ')')
    .css ('background-size',   presentation.getWidth () + ', ' + presentation.getHeight ())
    .css ('background-repeat', 'no-repeat')
    .css ('width',             presentation.getWidth ())
    .css ('height',            presentation.getHeight ())
    .css ('position',          'relative')
    .append (presentation_createOverlayInsetElement (label, icon))
    .append (presentation_createOverlayElement ());
}

/*
*/
function presentation_createAudioToggleElement (presentationElement) {
  var inputElement = $('<input></input>')
    .addClass ('presentation_audio_toggle_input')
    .attr ('type', 'checkbox')
    .prop ('checked', presentation_AUDIO)
    .change (function (event) {
        var checked = $(this).prop ('checked');
        presentation_AUDIO = checked

        checked || responsiveVoice.cancel ();

        var stepElement = presentationElement.stepElements [presentationElement.intro._currentStep];
        if (stepElement) {
          if (checked) {
            if (!stepElement.spoken) {
              stepElement.speak ();
            }
          } else { // !checked
            stepElement.spoken = false;
          }
        }
      });

  return $('<div></div>')
    .addClass ('presentation_audio_toggle')
    .addClass ('materialize')
    .attr ('tabindex', 0)
    .append ($('<div></div>')
      .addClass ('switch')
      .append ($('<span></span>')
        .addClass ('presentation_audio_toggle_label')
        .text ('AUDIO NARRATION'))
      .append ($('<label></label>')
        .append ('OFF')
        .append (inputElement)
        .append ($('<span></span>')
          .addClass ('lever'))
        .append ($('<span></span>')
          .addClass ('presentation_audio_toggle_on')
          .text ('ON'))))
    .keydown (function (event) {
        event.keyCode === 13 && inputElement.prop ('checked', !inputElement.prop ('checked'));
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

/*
  Accepts one argument: htmlTranscript, an HTML
  string or JQuery HTML Element; that represents
  a speech transcript and returns a punctuated
  version of htmlTranscript with HTML tags
  removed as a string.
*/
presentation_punctuate = function (htmlTranscript) {
  // I. Append punctuation to paragraphs and headers.
  var transcript = $('<div></div>').html (htmlTranscript);
  $('h1,h2,h3,h4,h5,p', transcript).map (
    function (i, element) {
      if (!$(element).text ().match (/[!?.]$/)) {
        $(element).append ('.');
      }
  });

  // II. Remove ending and internal whitespace.
  return transcript.text ().trim ().replace (/\s+/g, ' ');
} 

/*
  Accepts on argument: htmlTranscript, an HTML
  string or JQuary HTML Element that represents a
  speech transcript; punctuates the transcript,
  and reads it aloud using a text to speech
  synthesizer.
*/
presentation_speak = function (htmlTranscript) {
  responsiveVoice.speak (presentation_punctuate (htmlTranscript));
}