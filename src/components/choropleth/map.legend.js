import * as d3 from 'd3';

import * as util from './utils';
import MapBase from './map.base';

/**
 * Initialize a new `MapLegend`.
 * @class
 * @extends MapBase
 * @see MapBase
 * @param {Object} settings - Configuration options
 * @description Map legend component.
 * @access public
 */

export default class MapLegend extends MapBase {
  constructor(settings) {
    const defaults = {
      container: '#legend',
      width: 1000,
      height: 60,
      margin: {
        right: 20,
        left: 20,
        top: 4,
        bottom: 0,
      },
      scale: {
        unit: 1,
        ticks: 10,
      },
      radius: 7.5,
      class: 'density-circle',
    };

    super(util.merge({}, defaults, settings));
  }

  /**
   * Tick formater for legend axis
   * @param {Object} datum
   * @return {Function} - d3 formater
   * @access protected
   */

  tickFormat(datum) {
    return util.format.tick(this.scale, this.settings.scale.unit)(datum);
  }

  /**
   * Build legend dom elements
   * @param {Object} options
   * @param {Object[]} options.layers - Legend layers
   * @param {Object} options.layers[].shape - Layer GeoJSON
   * @param {Object} options.layers[].data - Layer values
   * @access public
   */

  render(options) {
    this.svg = d3.select(this.settings.container).append('svg')
      .attr({
        height: this.settings.height,
        width: this.settings.width,
      });

    this.scale = d3.scaleLinear()
      .range([0, this.settings.width - (this.settings.margin.right + this.settings.margin.left)]);

    this.axis = d3.svg.axis()
      .scale(this.scale)
      .ticks(this.settings.scale.ticks)
      .orient('bottom')
      .tickFormat(this.tickFormat.bind(this))
      .innerTickSize(3)
      .outerTickSize(7);

    this.gradient = this.svg
      .append('svg:defs')
      .append('svg:linearGradient')
      .attr({
        id: `${this.settings.container.split(' ')[0].replace('#', '')}-gradient`,
        x1: '0%',
        x2: '100%',
        y1: '0%',
        y2: '0%',
      });

    this.group = this.svg.append('g')
      .attr('transform', `translate(${this.settings.margin.left}, ${this.settings.margin.top})`);

    this.dotGroup = this.group.append('g')
      .attr('class', 'dots')
      .attr('transform', 'translate(0, 10)');

    this.bar = this.group.append('g')
      .attr('transform', 'translate(0, 20)')
      .attr('class', 'color-bar')
      .append('rect')
      .attr({
        y: '0px',
        x: '0px',
        height: '15px',
        width: (this.settings.width - (this.settings.margin.right + this.settings.margin.left)),
        stroke: 'none',
        fill: `url(#${this.settings.container.split(' ')[0].replace('#', '')}-gradient)`,
      });

    this.labels = this.group.append('g')
      .attr({
        transform: 'translate(0, 40)',
        class: 'axis',
      }).call(this.axis);

    this.update(options);
  }

  /**
   * Update legend dom elements
   * @param {Object} options
   * @param {Object[]} options.layers - Map layers
   * @param {Object} options.layers[].shape - Layer GeoJSON
   * @param {Object} options.layers[].data - Layer values
   * @param {Boolean} [options.animate=true] - Flag to turn off animation
   * @access public
   */

  update(options) {
    const { layers, animate = true } = options;

    if (layers) this.data = layers;

    const colors = this.colors[this.settings.scale.direction];
    const extent = this.extent();
    const domain = this.domain();

    const range = (extent[0] - extent[1]);
    const x1 = ((extent[0] - domain[0]) / range) * 100;
    const x2 = 100 - (((domain[domain.length - 1] - extent[1]) / range) * 100);

    this.transition(this.gradient, animate)
      .attr({
        x1: `${(Number.isNaN(x1) || !Number.isFinite(x1)) ? 0 : x1}%`,
        x2: `${(Number.isNaN(x2) || !Number.isFinite(x2)) ? 100 : x2}%`,
      });

    this.axis.scale(this.scale.domain(extent));

    this.colorize
      .range(this.colors[this.settings.scale.direction])
      .domain(domain);

    const data = this.data.reduce((dataResults, layer) => {
      if (layer.shape && layer.shape.features && layer.dots !== false) {
        return dataResults.concat(layer.shape.features.reduce((featureResults, feature) => {
          if (feature.data.value || feature.data.value === 0) {
            const key = feature.properties[this.settings.key] || feature.properties.key;
            feature.layer = layer;
            feature.data = (layer.data && layer.data[key]) ? layer.data[key] : {};

            return featureResults.concat([feature]);
          }
          return featureResults;
        }, []));
      }
      return dataResults;
    }, []);

    this.stops = this.gradient.selectAll('stop').data(colors);

    this.dots = this.dotGroup.selectAll('circle').data(data, (d) => {
      return d.properties[this.settings.key];
    });

    this.stops.enter()
      .append('svg:stop')
      .attr({
        offset: (d, i) => {
          return (i / (colors.length - 1));
        },
        'stop-color': (d) => {
          return d;
        },
      });

    this.dots.enter()
      .append('circle')
      .style('opacity', 0)
      .attr({
        r: () => {
          return this.settings.radius;
        },
        cx: (d) => {
          return this.scale(d.data.value);
        },
        class: (d) => {
          return this.classes(d).join(' ');
        },
      })
      .call(this.styles.bind(this), true);

    this.stops.exit().remove();

    this.transition(this.dots.exit(), animate)
      .style('opacity', 0)
      .remove();

    this.transition(this.stops, animate)
      .attr('stop-color', (d) => {
        return d;
      });

    this.transition(this.dots, animate)
      .style('opacity', 1)
      .attr({
        cx: (d) => {
          return this.scale(d.data.value);
        },
        class: (d) => {
          return this.classes(d).join(' ');
        },
      })
      .call(this.styles.bind(this));

    this.transition(this.labels, animate)
      .call(this.axis);

    this.nodes = this.dots;

    this.select(undefined, { update: false });
  }

  /**
   * Resize legend to new dimenations
   * @param {Number} newWidth - New width
   * @param {Number} newHeight - New height
   * @access public
   */

  resize(newWidth, newHeight) {
    this.settings.width = newWidth;
    this.settings.height = newHeight;

    const { width, height, margin } = this.settings;

    this.svg.attr({
      height,
      width,
    });

    this.bar.attr('width', width - (margin.right + margin.left));
    this.axis.scale(this.scale.range([0, width - (margin.right + margin.left)]));
    this.labels.call(this.axis);
    this.dots.attr('cx', (d) => {
      return this.scale(d.data.value);
    });
  }
}
