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
            block_HANDLERS.add ('presentation_slide_block', presentation_slideBlock);

            // V. Continue.
            done (null);
        });
  });
});

/*
*/
function presentation_slideBlock (context, done) {
  var slideElementId = context.element.attr ('id');
  if (!slideElementId) {
    slideElementId = getUniqueId ();
  }

  var slideElement = presentation_DATABASE.getSlide (context.element.text ()).createElement (slideElementId);
  presentation_SLIDE_ELEMENTS.save (slideElement);

  var element = slideElement.element;
  context.element.replaceWith (element);
  done (null, element);
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
// function presentation_parseStep (slidePath, element) {}

/*
*/
function presentation_ButtonStep (id, text, position, top, left, width, height) {
  presentation_Step.call (this, id, text, position, top, left, width, height);
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
  var navElement = this;

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
    var backElement = $('.presentation_nav_back', navElement.element);
    intro._currentStep === 0 ?
      backElement.addClass    ('presentation_disabled'):
      backElement.removeClass ('presentation_disabled');

    // II. Enable/disable the step buttons.
    for (var i = 0; i < stepElements.length; i ++) {
      var stepElement = $('[data-presentation-nav-step="' + i + '"]', navElement.element);
      (i === 0 || stepElements [i - 1].completed ()) ?
        stepElement.removeClass ('presentation_disabled'):
        stepElement.addClass    ('presentation_disabled');
    }

    // III. Highlight the current step button.
    $('.presentation_nav_step', navElement.element).removeClass ('presentation_current_step');
    $('[data-presentation-nav-step="' + intro._currentStep + '"]', navElement.element).addClass ('presentation_current_step');

    // IV. Enable/disable the Next button.
    var nextElement = $('.presentation_nav_next', navElement.element);
    stepElements [intro._currentStep].completed () ?
      nextElement.removeClass ('presentation_disabled'):
      nextElement.addClass    ('presentation_disabled');
  }

  for (var i = 0; i < stepElements.length; i ++) {
    stepElements [i].oncomplete (
      function (done) {
        navElement.refresh ();
        done (null);
    });
  }
}

/*
*/
function presentation_SlideElement (id, slide) {
  var slideElement = this;

  // Returns this slide element's HTML element ID.
  this.id = function () { return id; }

  // The JQuery HTML Element that represents this slide element.
  this.element = $('<div></div>')
    .attr ('id', id)
    .addClass ('presentation_slide')
    .attr ('data-presentation-slide', slide.getId ())
    .css ('background-image',  'url(' + slide.getImage () + ')')
    .css ('background-size',   slide.getWidth () + ', ' + slide.getHeight ())
    .css ('background-repeat', 'no-repeat')
    .css ('width',             slide.getWidth ())
    .css ('height',            slide.getHeight ())
    .css ('position',          'relative');

  // The IntroJS object associated with this slide element.
  this.intro = introJs (slideElement.element.get (0));

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

  // The Steps associated with the slide.
  var steps = slide.getSteps ();

  // The step elements associated with this slide element.
  var stepElements = [];

  for (var i = 0; i < steps.length; i ++) {
    var step = steps [i];

    var stepElement = new presentation_StepElement (this.intro, step);
    stepElements.push (stepElement);

    slideElement.element.append (stepElement.element
      .css ('background-image',    'url(' + slide.getImage () + ')')
      .css ('background-position', '-' + step.left + ' -' + step.top)
      .css ('background-size',     slide.getWidth () + ', ' + slide.getHeight ())
      .css ('background-repeat',   'no-repeat'));

    introOptions.steps.push ({
      element:  '#' + stepElement.element.attr ('id'),
      intro:    step.text,
      position: step.position,
    });
  }

  // The nav element associated with this slide element.
  var navElement = new presentation_NavElement (this.intro, stepElements);

  this.intro.setOptions (introOptions)
    .onafterchange (
        function () {
          if ($('.presentation_nav', slideElement.element).length === 0) {
            $('.introjs-tooltip', slideElement.element)
              .prepend ($('<div class="presentation_exit"></div>')
                  .click (function (event) {
                      event.stopPropagation ();
                      slideElement.intro.exit ();
                }))
              .append (navElement.element);
          }
          navElement.refresh ();
      });

  this.element.click (
    function () {
      slideElement.intro.running || slideElement.intro.start ();
  });

  PAGE_LOAD_HANDLERS.add (
    function (id, done) {
      intro.exit ();
      done (null);
  });
}

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
    var slideElementId = slideElement.id ();
    if (slideElements [slideElementId]) {
      strictError (new Error ('[presentation][presentation_SlideElementStore] Error: an error occured while trying to save a slide element. Another slide element already has the given ID.'));
      return null;
    }
    slideElements [slideElementId] = slideElement;

    if (!slideElementFunctions [slideElementId]) {
      slideElementFunctions [slideElementId] = [];
    }
    for (var i = 0; i < slideElementFunctions [slideElementId].length; i ++) {
      (slideElementFunctions [slideElementId][i]) (slideElement);
    }
  }
};

/*
*/
var presentation_SLIDE_ELEMENTS = new presentation_SlideElementsStore ();

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