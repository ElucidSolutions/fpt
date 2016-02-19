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
    loadScript ('modules/presentation/lib/intro.js-2.0/intro.js',
      function () {
        // II. Load the Intro.JS stylesheets.
        $.getCSS ('modules/presentation/lib/intro.js-2.0/introjs.css');

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
  var element = presentation_DATABASE.getSlide (blockElement.text ()).createElement ();
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
  this.elementId = null;
}

/*
*/
presentation_Step.prototype.createElement = function () {
  this.elementId = getUniqueId ();
  return $('<div></div>')
    .addClass ('presentation_step')
    .attr ('data-presentation-step', this.id)
    .attr ('id',                     this.elementId)
    .css ('position',                'relative')
    .css ('top',                     this.top)
    .css ('left',                    this.left)
    .css ('width',                   this.width)
    .css ('height',                  this.height);
}

/*
*/
function presentation_parseStep (slidePath, element) {
  var path = slidePath.concat ($('> name', element).text ());
  return new presentation_Step (
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
  this.id         = id;
  this.text       = text;
  this.position   = position;
  this.top        = top;
  this.left       = left;
  this.width      = width;
  this.height     = height;
  this.expression = expression;

  this.elementId  = null;
}

/*
*/
presentation_InputStep.prototype = Object.create (presentation_Step.prototype);

/*
*/
presentation_InputStep.prototype.constructor = presentation_InputStep;

/*
*/
presentation_InputStep.prototype.createElement = function () {

  this.elementId = getUniqueId ();
  var element = $('<div></div>')
    .addClass ('presentation_step')
    .attr ('data-presentation-step', this.id)
    .attr ('id',                     this.elementId)
    .css ('position',                'relative')
    .css ('top',                     this.top)
    .css ('left',                    this.left)
    .css ('width',                   this.width)
    .css ('height',                  this.height);

  var expression = new RegExp (this.expression);
  var inputElement = $('<input></input>')
    .attr ('type', 'text')
    .keypress (
      function () {
        expression.test (inputElement.val ()) ?
          element.addClass    ('presentation_valid') :
          element.removeClass ('presentation_valid') ;
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
*/
function presentation_Slide (id, image, next, steps) {
  this.id      = id;
  this.image   = image;
  this.next    = next;
  this.steps   = steps;

  this.running = false;
}

/*
*/
presentation_Slide.prototype.createElement = function () {
  var element = $('<div></div>')
    .addClass ('presentation_slide')
    .attr ('data-presentation-slide', this.id)
    .css ('background-image', 'url(' + this.image + ')');

  var options = {
    steps: []
  };

  for (var i = 0; i < this.steps.length; i ++) {
    var step = this.steps [i];

    var stepElement = step.createElement ();
    element.append (stepElement);

    options.steps.push ({
      element:  '#' + stepElement.attr ('id'),
      intro:    step.text,
      position: step.position,
    });
  }

  var intro = introJs (element.get (0));
  var self = this;
  intro
    .setOptions (options)
    .onexit (
      function () {
        $('.presentation_valid', element).removeClass ('presentation_valid');
        self.running = false;     
    })
    .oncomplete (
      function () {
        this.exit ();
        if (self.next) {
          loadPage (self.next, function () {}, function () {});
        }
    });

  element.click (
    function () {
      if (!self.running) {
        self.running = true;
        intro.start ();
      }
  });

  PAGE_LOAD_HANDLERS.push (
    function (done) {
      self.running = false;
      intro.exit ();
      done ();
  });

  return element;
}

/*
*/
function presentation_parseSlide (presentationPath, element) {
  var path = presentationPath.concat ($('> name', element).text ());
  var next = $('> next', element).text ();

  return new presentation_Slide (
    presentation_getId ('presentation_slide_page', path),
    $('> image', element).text (),
    next === '' ? null : next,
    $('> steps', element).children ().map (
      function (i, stepElement) {
        var tagName = $(stepElement).prop ('tagName');
        switch (tagName) {
          case 'blankStep':
            return presentation_parseStep (path, stepElement); 
          case 'inputStep':
            return presentation_parseInputStep (path, stepElement);
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
    if (this.slides [i].id === id) {
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