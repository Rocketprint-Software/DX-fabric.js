(function(global) {

  'use strict';

  var extend = fabric.util.object.extend;

  if (!global.fabric) {
    global.fabric = { };
  }

  if (global.fabric.ImageBoundary) {
    fabric.warn('fabric.ImageBoundary is already defined.');
    return;
  }

  /**
   * ImageBoundary class
   * @class fabric.ImageBoundary
   * @extends fabric.Image
   * @see {@link fabric.ImageBoundary#initialize} for constructor definition
   */
  fabric.ImageBoundary = fabric.util.createClass(fabric.Image, fabric.Observable, /** @lends fabric.ImageBoundary.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'image-boundary',

    /**
     * The current scaling mode (fill, contain, center or stretch)
     * @type String
     */
    scalingMode: 'contain',

    _renderedDPIScalar: 1,

    /**
     * Constructor
     * @param {HTMLImageElement | String} element Image element
     * @param {Object} [options] Options object
     * @param {function} [callback] callback function to call after eventual filters applied.
     * @return {fabric.Image} thisArg
     */
    initialize: function(element, options) {
      this.callSuper('initialize', element, options);
    },

    transform: function(ctx) {
      var m;
      if (this.group && !this.group._transformDone) {
        m = this.calcTransformMatrix();
      }
      else {
        m = this.calcOwnMatrix();
      }

      if(this.scalingMode === 'fill') {
        // hscale, hskew, vskew, vscale, hx, hy
        if(Math.abs(m[0]) < Math.abs(m[3])) m[0] = m[3];
        else m[3] = m[0];

        this._renderedDPIScalar = m[3];
      }
      else if(this.scalingMode === 'contain') {
        if(Math.abs(m[0]) < Math.abs(m[3])) m[3] = m[0];
        else m[0] = m[3];
        this._renderedDPIScalar = m[3];
      }
      else if(this.scalingMode === 'center') {
        if(Math.abs(m[0]) < Math.abs(m[3])) m[3] = m[0];
        else m[0] = m[3];
        m[0] = m[3] = Math.min(1, m[0]);
        this._renderedDPIScalar = m[3];
      }
      else if(this.scalingMode === 'stretch') {
        this._renderedDPIScalar = Math.max(Math.abs(m[3]), Math.abs(m[0]));
      }

      ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
    },
  });


    /**
     * Creates an instance of fabric.Image from its object representation
     * @static
     * @param {Object} object Object to create an instance from
     * @param {Function} callback Callback to invoke when an image instance is created
     */
    fabric.ImageBoundary.fromObject = function(object, callback) {
      fabric.util.loadImage(object.src, function(img, error) {
        if (error) {
          callback && callback(null, error);
          return;
        }
        fabric.ImageBoundary.prototype._initFilters.call(object, object.filters, function(filters) {
          object.filters = filters || [];
          fabric.ImageBoundary.prototype._initFilters.call(object, [object.resizeFilter], function(resizeFilters) {
            object.resizeFilter = resizeFilters[0];
            var image = new fabric.ImageBoundary(img, object);
            callback(image);
          });
        });
      }, null, object.crossOrigin);
    };

})(typeof exports !== 'undefined' ? exports : this);
