// /* eslint-disable */
// import jQuery from 'jquery';
//
// ((($) => {
//   $.fn.invisible = function () {
//     return this.each(function () {
//       $(this).css('visibility', 'hidden');
//     });
//   };
//   $.fn.visible = function () {
//     return this.each(function () {
//       $(this).css('visibility', 'visible');
//     });
//   };
//   $.fn.disable = function () {
//     return this.each(function () {
//       $(this).attr('disabled', true);
//     });
//   };
//   $.fn.enable = function () {
//     return this.each(function () {
//       $(this).attr('disabled', false);
//     });
//   };
//
//   $.fn.redraw = function () {
//     return $(this).each(function () {
//       const redraw = this.offsetHeight;
//     });
//   };
//
//   $.fn.htmlClean = function () {
//     this.contents().filter(function () {
//       if (this.nodeType != 3) {
//         $(this).htmlClean();
//         return false;
//       }
//
//       this.textContent = $.trim(this.textContent);
//       return !/\S/.test(this.nodeValue);
//     }).remove();
//     return this;
//   };
//
//   $.widget('ui.dragslider', $.ui.slider, {
//     options: $.extend({}, $.ui.slider.prototype.options, { rangeDrag: false }),
//
//     _create() {
//       $.ui.slider.prototype._create.apply(this, arguments);
//       this._rangeCapture = false;
//     },
//
//     _mouseCapture(event) {
//       const o = this.options;
//
//       if (o.disabled) return false;
//
//       if (event.target == this.range.get(0) && o.rangeDrag == true && o.range == true) {
//         this._rangeCapture = true;
//         this._rangeStart = null;
//       } else {
//         this._rangeCapture = false;
//       }
//
//       $.ui.slider.prototype._mouseCapture.apply(this, arguments);
//
//       if (this._rangeCapture == true) {
//         this.handles.removeClass('ui-state-active').blur();
//       }
//
//       return true;
//     },
//
//     _mouseStop(event) {
//       this._rangeStart = null;
//       return $.ui.slider.prototype._mouseStop.apply(this, arguments);
//     },
//
//     _slide(event, index, newVal) {
//       if (!this._rangeCapture) {
//         return $.ui.slider.prototype._slide.apply(this, arguments);
//       }
//
//       if (this._rangeStart == null) {
//         this._rangeStart = newVal;
//       }
//
//       const oldValLeft = this.options.values[0];
//       const oldValRight = this.options.values[1];
//       let slideDist = newVal - this._rangeStart;
//       let newValueLeft = oldValLeft + slideDist;
//       let newValueRight = oldValRight + slideDist;
//
//       if (this.options.values && this.options.values.length) {
//         if (newValueRight > this._valueMax() && slideDist > 0) {
//           slideDist -= (newValueRight - this._valueMax());
//           newValueLeft = oldValLeft + slideDist;
//           newValueRight = oldValRight + slideDist;
//         }
//
//         if (newValueLeft < this._valueMin()) {
//           slideDist += (this._valueMin() - newValueLeft);
//           newValueLeft = oldValLeft + slideDist;
//           newValueRight = oldValRight + slideDist;
//         }
//
//         if (slideDist !== 0) {
//           const newValues = this.values();
//           newValues[0] = newValueLeft;
//           newValues[1] = newValueRight;
//
//           // A slide can be canceled by returning false from the slide callback
//           const allowed = this._trigger('slide', event, {
//             handle: this.handles[index],
//             value: slideDist,
//             values: newValues,
//           });
//
//           if (allowed !== false) {
//             this.values(0, newValueLeft, true);
//             this.values(1, newValueRight, true);
//           }
//           this._rangeStart = newVal;
//         }
//       }
//     },
//   });
// })(jQuery));
//
// String.prototype.width = function (size = 12, font) {
//   const canvas = String.prototype.width.canvas ||
//     (String.prototype.width.canvas = document.createElement('canvas'));
//   const context = canvas.getContext('2d');
//   context.font = font || (`${size}px Verdana`);
//   const metrics = context.measureText(this);
//   return Math.ceil(metrics.width);
// };
//
// String.prototype.capitalize = function () {
//   return this.charAt(0).toUpperCase() + this.slice(1);
// };
//
// String.prototype.ucwords = function () {
//   return (`${this}`).replace(/^([a-z])|\s+([a-z])/g, ($1) => { return $1.toUpperCase(); });
// };
//
// String.prototype.isIn = function (list = []) {
//   return list.includes(this.valueOf());
// };
//
// Number.prototype.isIn = function (list = []) {
//   return list.includes(this.valueOf());
// };
//
// Object.filter = (obj, predicate) => {
//   const result = {};
//   let key;
//
//   for (key in obj) {
//     if (obj.hasOwnProperty(key) && predicate(obj[key])) {
//       result[key] = obj[key];
//     }
//   }
//
//   return result;
// };
//
// Object.size = (obj) => {
//   let size = 0;
//   let key;
//   for (key in obj) {
//     if (obj.hasOwnProperty(key)) size++;
//   }
//   return size;
// };
