(function(global) {

  'use strict';

  var fabric = global.fabric || (global.fabric = { }),
      extend = fabric.util.object.extend;

  if (fabric.ImageArea) {
    fabric.warn('fabric.ImageArea is already defined');
    return;
  }

  /**
   * Class that positions an Image element inside it's boundaries
   * @class fabric.ImageArea
   * @extends fabric.Object
   * @return {fabric.ImageArea} thisArg
   * @see {@link fabric.ImageArea#initialize} for constructor definition
   */
  fabric.ImageArea = fabric.util.createClass(fabric.Object, /** @lends fabric.ImageArea.prototype */ {

    /**
     * List of properties to consider when checking if state of an object is changed ({@link fabric.Object#hasStateChanged})
     * as well as for history (undo/redo) purposes
     * @type Array
     */
    stateProperties: fabric.Object.prototype.stateProperties.concat('childImage'),

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'image-area',

    /**
     * The image element this area is containing
     * @type fabric.Image
    */
    childImage: undefined,

    /**
     * The ID of the image element this area is containing
     * @type Number
     */
    childImageId: -1,

    /**
     * The current scaling mode (fill, contain, center or stretch)
     * @type String
     */
    scalingMode: 'contain',

    /**
     * Width of a stroke.
     * For image quality a stroke multiple of 2 gives better results.
     * @type Number
     * @default
     */
    strokeWidth: 0,

    cacheProperties: fabric.Object.prototype.cacheProperties.concat('childImage'),

    /**
     * Constructor
     * @param {Object} [options] Options object
     * @return {Object} thisArg
     */
    initialize: function(element, options, imageOptions) {
      this.callSuper('initialize', options);

      this.on('added', function() {
        if (typeof element !== 'undefined') {
          this.setChildImage(element, imageOptions);
        }
      });

      this.on('removed', function() {
        this.childImage.canvas.remove(this.childImage);
      });

      this.on('moving', function() {
        this.updateChildPosition();
      });

      this.on('scaling', function() {
        this.updateChildPosition();
      });

      this.on('rotating', function() {
        this.updateChildPosition();
      });
    },

    _superZIndexOperation: function(operation) {
      // remove the child image so it doesn't interfere
      var canv = this.childImage.canvas;
      canv.remove(this.childImage);

      // execute as usual
      this.callSuper(operation);

      // add child image back
      canv.add(this.childImage);

      // set child image's z-index to the same as us
      canv.moveTo(this.childImage, this.canvas.getObjects().indexOf(this));
    },

    bringToFront: function() {
      this._superZIndexOperation('bringToFront');
    },

    bringForward: function() {
      this._superZIndexOperation('bringForward');
    },

    sendToBack: function() {
      console.log('sending to back');
      this._superZIndexOperation('sendToBack');
    },

    sendBackwards: function() {
      this._superZIndexOperation('sendBackwards');
    },

    setChildImage: function(element, imageOptions) {
      if (typeof element !== 'undefined') {
        if (element instanceof Image) {
          this.childImage = new fabric.Image(element, imageOptions);
          this.canvas.add(this.childImage);
        }
        else if(element instanceof fabric.Image) {
          this.childImage = element;
        }
      }

      if (typeof this.childImage !== 'undefined') {
        this.childImageId = 'childImage' + (fabric.ImageArea.nextId++);
        this.childImage.set({
          evented: false,
          originX: 'center',
          originY: 'center',
          id: this.childImageId,
          childImage: true
        });
        this.updateChildPosition();
      }
    },

    getChildImage: function() {
      // if the childImage isn't defined
      if (typeof this.childImage === 'undefined') {
        // search for it on the canvas
        var childImageId = this.childImageId;
        var obj = this.canvas.getObjects().find(function(o) { return o.id === childImageId });
        if (typeof obj === 'undefined')
          return undefined;
        else
          this.setChildImage(obj);
      }

      return this.childImage;
    },

    updateChildPosition: function() {
      var childImage = this.getChildImage();
      if (typeof childImage === 'undefined') {
        return;
      }

      var center = this.getCenterPoint();
      childImage.angle = this.angle;
      childImage.left = center.x;
      childImage.top = center.y;

      if (this.scalingMode === 'center') {
        // do nothing
      } else if (this.scalingMode === 'stretch') {
        childImage.scaleX = (this.width * this.scaleX) / childImage.width;
        childImage.scaleY = (this.height * this.scaleY) / childImage.height;
      } else if (this.scalingMode === 'contain' || this.scalingMode === 'fill') {
        var scale = 1;
        var tw = this.width * this.scaleX;
        var th = this.height * this.scaleY;

        var yIsBigger = (childImage.width / childImage.height) > (tw / th);
        if ((!yIsBigger && this.scalingMode === 'contain') || (yIsBigger && this.scalingMode === 'fill')) {
          scale = (this.height * this.scaleY) / childImage.height;
        } else {
          scale = (this.width * this.scaleX) / childImage.width;
        }
        childImage.scaleX = childImage.scaleY = scale;
      }
    },

    _stroke: function(ctx) {
      if (!this.stroke || this.strokeWidth === 0) {
        return;
      }
      var w = this.width / 2, h = this.height / 2;
      ctx.beginPath();
      ctx.moveTo(-w, -h);
      ctx.lineTo(w, -h);
      ctx.lineTo(w, h);
      ctx.lineTo(-w, h);
      ctx.lineTo(-w, -h);
      ctx.closePath();
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderDashedStroke: function(ctx) {
      var x = -this.width / 2,
          y = -this.height / 2,
          w = this.width,
          h = this.height;

      ctx.save();
      this._setStrokeStyles(ctx, this);

      ctx.beginPath();
      fabric.util.drawDashedLine(ctx, x, y, x + w, y, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, x + w, y, x + w, y + h, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, x + w, y + h, x, y + h, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, x, y + h, x, y, this.strokeDashArray);
      ctx.closePath();
      ctx.restore();
    },

    _render: function(ctx) {
      this._stroke(ctx);
      this._renderPaintInOrder(ctx);
    },

    /**
     * Pass through functions to the child Image class
     */
    setSrc: function(src, callback, options) {
      var childImage_ = this.getChildImage();
      if (typeof childImage_ !== 'undefined') 
        childImage_.setSrc(src, function (a) {
          callback && callback(a);
          this.updateChildPosition();
        }, options);
    },

    setElement: function(element, options) {
      var childImage_ = this.getChildImage();
      if (typeof childImage_ !== 'undefined') {
        childImage_.setElement(element, options);
        this.updateChildPosition();
      }
    },

    /**
     * Returns object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return this.callSuper('toObject', [ 'childImageId', 'scalingMode' ].concat(propertiesToInclude));
    },

    /* _TO_SVG_START_ */
    /**
     * Returns svg representation of an instance
     * @param {Function} [reviver] Method for further parsing of svg representation.
     * @return {String} svg representation of an instance
     */
    toSVG: function(reviver) {
      return reviver ? reviver('') : '';
    },
    /* _TO_SVG_END_ */
  });

  /* _FROM_SVG_START_ */
  /**
   * List of attribute names to account for when parsing SVG element (used by `fabric.ImageArea.fromElement`)
   * @static
   * @memberOf fabric.ImageArea
   * @see: http://www.w3.org/TR/SVG/shapes.html#ImageAreaElement
   */
  fabric.ImageArea.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat('x y width height'.split(' '));

  /**
   * Returns {@link fabric.ImageArea} instance from an SVG element
   * @static
   * @memberOf fabric.ImageArea
   * @param {SVGElement} element Element to parse
   * @param {Function} callback callback function invoked after parsing
   * @param {Object} [options] Options object
   */
  fabric.ImageArea.fromElement = function(element, callback, options) {
    if (!element) {
      return callback(null);
    }
    options = options || { };

    var parsedAttributes = fabric.parseAttributes(element, fabric.ImageArea.ATTRIBUTE_NAMES);

    parsedAttributes.left = parsedAttributes.left || 0;
    parsedAttributes.top  = parsedAttributes.top  || 0;
    var imgA = new fabric.ImageArea(extend((options ? fabric.util.object.clone(options) : { }), parsedAttributes));
    imgA.visible = imgA.visible && imgA.width > 0 && imgA.height > 0;
    callback(imgA);
  };
  /* _FROM_SVG_END_ */

  /**
   * Returns {@link fabric.ImageArea} instance from an object representation
   * @static
   * @memberOf fabric.ImageArea
   * @param {Object} object Object to create an instance from
   * @param {Function} [callback] Callback to invoke when an fabric.ImageArea instance is created
   */
  fabric.ImageArea.fromObject = function(object, callback) {
    var o = new fabric.ImageArea(undefined, object);
    callback(o);
    return o;
    //return fabric.Object._fromObject('ImageArea', object, callback);
  };

  fabric.ImageArea.nextId = 0;

})(typeof exports !== 'undefined' ? exports : this);
