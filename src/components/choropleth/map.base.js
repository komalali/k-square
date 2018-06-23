import d3 from 'd3';
import Emitter from 'events';

import * as util from './util';

/**
 * Initialize a new `MapBase`.
 * @class
 * @extends Emitter
 * @see MapChart
 * @see MapLegend
 * @param {Object} settings - Configuration options
 * @description Shared components for MapChart and MapLegend.
 * @access protected
 */

export default class MapBase extends Emitter {
  constructor(settings) {
    super();

    const defaults = {
      key: 'location_id',
      animation: 1000,
      selected: [],
      colors: [
        'rgb(165,0,38)',
        'rgb(215,48,39)',
        'rgb(244,109,67)',
        'rgb(253,174,97)',
        'rgb(254,224,144)',
        'rgb(255,255,191)',
        'rgb(224,243,248)',
        'rgb(171,217,233)',
        'rgb(116,173,209)',
        'rgb(69,117,180)',
        'rgb(49,54,149)',
      ],
      scale: {
        direction: '-',
        domain: [false, false],
        extent: [false, false],
      },
      filter: [false, false],
      style: {
        fill: (feature) => {
          return this.color(feature);
        },
        stroke: (feature) => {
          return this.color(feature);
        },
      },
    };

    this.settings = util.merge({}, defaults, settings);

    this.colors = {
      '+': util.copy(this.settings.colors),
      '-': util.copy(this.settings.colors).reverse(),
    };

    this.colorize = d3.scale.linear()
      .range(this.colors[this.settings.scale.direction])
      .clamp(true);
  }

  /**
   * Determine should transition occur
   * @param {Selection} selection - d3 selection
   * @param {Boolean} animate
   * @return {Selection|Transition}
   * @access protected
   */

  transition(selection, animate) {
    const { animation = 0 } = this.settings;

    if (animate && animation > 0) {
      return selection.transition().duration(animation);
    }
    return selection;
  }

  /**
   * Determine color for feature
   * @param {Object} feature - GeoJSON feature
   * @return {String} - html color
   * @access protected
   */

  color(feature) {
    const {
      color = undefined,
      value = undefined,
    } = feature.data;

    if (color) return color;

    return (value !== undefined) ? this.colorize(value) : null;
  }

  /**
   * Apply styles to features
   * @param {Selection} selection
   * @param {Boolean} [initial=false] - force default styles
   * @return {Array}
   * @access protected
   */

  styles(selection, initial = false) {
    return selection.style({
      fill: (featrue) => {
        const { style } = featrue.layer;

        const fill = (style.fill instanceof Function) ?
          style.fill.apply(this, [featrue, initial]) :
          style.fill;

        featrue.style = featrue.style || {};
        featrue.style.fill = fill;
        return fill;
      },
      stroke: (featrue) => {
        const { style } = featrue.layer;

        const stroke = (style.stroke instanceof Function) ?
          style.stroke.apply(this, [featrue, initial]) :
          style.stroke;

        featrue.style = featrue.style || {};
        featrue.style.stroke = stroke;
        return stroke;
      },
    });
  }

  classes(feature) {
    const classes = [this.settings.class];

    const { disputes } = feature.properties;
    const { value = undefined } = feature.data;

    if (disputes && disputes.length) classes.push('disputed');

    if (this.selected(feature)) classes.push('selected');
    if (value === undefined) classes.push('no-data');

    if (feature.properties.class) {
      classes.push(feature.properties.class);
    }

    const { filter } = this.settings;

    if (filter) {
      if (filter[0] !== false && value < filter[0]) classes.push('filtered');
      if (filter[1] !== false && value > filter[1]) classes.push('filtered');
    }

    feature.classes = classes;

    return classes;
  }

  /**
   * Determine if feature is selected
   * @param {Object} feature - GeoJSON feature
   * @return {Boolean}
   * @access protected
   */

  selected(feature) {
    const location = feature.properties[this.settings.key];
    const { disputes } = feature.properties;
    const { selected } = this.settings;

    if (!location && !disputes) return false;

    const isSelected = util.doesIntersect(location, selected);

    if (disputes) {
      const intersect = util.doesIntersect(selected, disputes);

      if (!location && intersect) return true;
      if (location && intersect && util.doesIntersect(location, disputes)) return true;
      if (intersect && !isSelected) return true;
    }

    return isSelected;
  }

  /**
   * Set selected location(s)
   * @param {Number|Number[]} location - Location key(s) to select
   * @param {Object} [options]
   * @param {Boolean} [options.update=true] - Flag to prevent update on set
   * @access public
   */

  select(location, options = { update: true }) {
    const { update } = options;

    if (location !== undefined) {
      this.settings.selected = ((Array.isArray(location)) ? location : [location]).map(Number);
    }

    if (this.nodes) {
      this.nodes.filter(this.selected.bind(this))
        .each(function () {
          this.parentNode.appendChild(this);
        });
    }

    if (update) this.update(options);
  }

  /**
   * Set scale direction
   * @param {String} direction - Scale direction [+,-]
   * @param {Object} [options]
   * @param {Boolean} [options.update=true] - Flag to prevent update on set
   * @access public
   */

  direction(direction, options = { update: true }) {
    const { update } = options;

    if (this.colors[direction]) {
      this.settings.scale.direction = util.copy(direction);
      if (update) this.update(options);
    }
  }

  /**
   * Set scale unit
   * @param {Number} unit
   * @param {Object} [options]
   * @param {Boolean} [options.update=true] - Flag to prevent update on set
   * @access public
   */

  unit(unit, options = { update: true }) {
    const { update } = options;

    if (unit !== undefined) {
      this.settings.scale.unit = util.copy(unit);
      if (update) this.update(options);
    }
  }

  /**
   * Set domain filter
   * @param {Number|Number[]} location - Location key(s) to select
   * @param {Object} [options]
   * @param {Boolean} [options.update=true] - Flag to prevent update on set
   * @access public
   */

  filter(filter, options = { update: true }) {
    const { update } = options;

    if (filter !== undefined) {
      this.settings.filter = util.copy(filter);
      if (update) this.update(options);
    }
  }

  /**
   * Get or set domain
   * @param {Array} newDomain
   * @param {Object} [options]
   * @param {Boolean} [options.update=true] - Flag to prevent update on set
   * @param {Boolean} [options.animate=true] - Flag to turn off animation when updating
   * @return {Array} - Returns the current domain
   * @access public
   */

  domain(newDomain, options = { update: true }) {
    const { update } = options;

    if (newDomain !== undefined) {
      this.settings.scale.domain = util.copy(newDomain);
      if (update) this.update(options);
      return newDomain;
    }

    const { direction, domain = [false, false] } = this.settings.scale;

    let computedDomain = [];

    if (domain[0] === false || domain[1] === false) {
      const extent = this.extent();
      computedDomain[0] = (domain[0] !== false) ? domain[0] : extent[0];
      computedDomain[1] = (domain[1] !== false) ? domain[1] : extent[1];
    } else {
      computedDomain = [...domain];
    }

    if (computedDomain[0] === computedDomain[1] && !computedDomain[0] && !computedDomain[1]) {
      computedDomain[0] = 0;
      computedDomain[1] = 1;
    }

    return util.range(computedDomain[0], computedDomain[1], this.colors[direction].length);
  }

  /**
   * Get or set extent
   * @param {Array} newExtent
   * @param {Object} [options]
   * @param {Boolean} [options.update=true] - Flag to prevent update on set
   * @param {Boolean} [options.animate=true] - Flag to turn off animation when updating
   * @return {Array} - Returns the current domain
   * @access public
   */

  extent(newExtent, options = { update: true }) {
    const { update } = options;

    if (newExtent !== undefined) {
      this.settings.scale.extent = util.copy(newExtent);
      if (update) this.update(options);
      return newExtent;
    }

    const data = this.data || [];

    const currentExtent = d3.extent(data.reduce((results, layer) => {
      let extent = [];

      if (layer.extent) {
        ({ extent } = layer);
      } else if (layer.data) {
        extent = d3.extent(d3.values(layer.data).map(({ value }) => {
          return value;
        }));
      }

      return results.concat(extent);
    }, []));

    return [
      (this.settings.scale.extent[0] === false) ? currentExtent[0] : this.settings.scale.extent[0],
      (this.settings.scale.extent[1] === false) ? currentExtent[1] : this.settings.scale.extent[1],
    ];
  }
}
