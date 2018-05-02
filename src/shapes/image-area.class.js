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
    childImage: null,

    /**
     * The current scaling mode (fill, contain, center or stretch)
     * @type String
     */
    scalingMode: 'contain',

    cacheProperties: fabric.Object.prototype.cacheProperties.concat('childImage'),

    /**
     * Constructor
     * @param {Object} [options] Options object
     * @return {Object} thisArg
     */
    initialize: function(element, options, imageOptions) {
      this.childImage = new fabric.Image(element, imageOptions);
      this.callSuper('initialize', options);
      console.log('init');

      this.on('added', function() {
        this.canvas.add(this.childImage);
        this.childImage.set({
          evented: false,
          originX: 'center',
          originY: 'center',
        });
        this.updateChildPosition();
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

    updateChildPosition: function() {
        var cx = this.left + this.width / 2 * this.scaleX;
        var cy = this.top + this.height / 2 * this.scaleY;
        this.childImage.angle = this.angle;
        this.childImage.left = cx;
        this.childImage.top = cy;

        if (this.scalingMode === 'center') {
            // do nothing
        } else if (this.scalingMode === 'stretch') {
            this.childImage.scaleX = (this.width * this.scaleX) / this.childImage.width;
            this.childImage.scaleY = (this.height * this.scaleY) / this.childImage.height;
        } else if (this.scalingMode === 'contain' || this.scalingMode === 'fill') {
            var scale = 1;
            var tw = this.width * this.scaleX;
            var th = this.height * this.scaleY;

            var yIsBigger = (this.childImage.width / this.childImage.height) > (tw / th);
            if ((!yIsBigger && this.scalingMode === 'contain') || (yIsBigger && this.scalingMode === 'fill')) {
                scale = (this.height * this.scaleY) / this.childImage.height;
            } else {
                scale = (this.width * this.scaleX) / this.childImage.width;
            }
            this.childImage.scaleX = this.childImage.scaleY = scale;
        }
    },

    _render: function(ctx) {

    },

    /**
     * Returns object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return this.callSuper('toObject', [].concat(propertiesToInclude));
    },

    /* _TO_SVG_START_ */
    /**
     * Returns svg representation of an instance
     * @param {Function} [reviver] Method for further parsing of svg representation.
     * @return {String} svg representation of an instance
     */
    toSVG: function(reviver) {
      // var markup = this._createBaseSVGMarkup(), x = -this.width / 2, y = -this.height / 2;
      // markup.push(
      //   '<rect ', this.getSvgId(),
      //   'x="', x, '" y="', y,
      //   '" rx="', this.get('rx'), '" ry="', this.get('ry'),
      //   '" width="', this.width, '" height="', this.height,
      //   '" style="', this.getSvgStyles(),
      //   '" transform="', this.getSvgTransform(),
      //   this.getSvgTransformMatrix(), '"',
      //   this.addPaintOrder(),
      //   '/>\n');
      //
      // return reviver ? reviver(markup.join('')) : markup.join('');
      return revier ? reviver('') : '';
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
    return fabric.Object._fromObject('ImageArea', object, callback);
  };

})(typeof exports !== 'undefined' ? exports : this);
