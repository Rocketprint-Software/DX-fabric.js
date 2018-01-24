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
        if(m[0] < m[3]) m[0] = m[3];
        else m[3] = m[0];
      }
      else if(this.scalingMode === 'contain') {
        if(m[0] < m[3]) m[3] = m[0];
        else m[0] = m[3];
      }
      else if(this.scalingMode === 'center') {
        if(m[0] < m[3]) m[3] = m[0];
        else m[0] = m[3];
        m[0] = m[3] = Math.min(1, m[0]);
      }

      ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
    },
  });

})(typeof exports !== 'undefined' ? exports : this);
