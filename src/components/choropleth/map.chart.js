import * as d3 from 'd3';
import {
  isEqual,
  merge,
} from 'lodash';

import MapBase from './map.base';

/**
 * Initialize a new `MapChart`.
 * @class
 * @extends MapBase
 * @see MapBase
 * @param {Object} settings - Configuration options
 * @description Map chart component.
 * @access public
 */
export default class MapChart extends MapBase {
  constructor(settings) {
    const defaults = {
      container: '#chart',
      width: 1000,
      height: 500,
      zoom: {
        extent: [0.3, 50],
        scale: 0,
        translate: [0, 0],
        increment: 1.5,
      },
      proportion: 0.95,
      class: 'location-path',
    };

    super(merge({}, defaults, settings));

    this.viewbox = {};

    const projection = {
      area: 1,
      scale: 1,
      translate: [0, 0],
      clipExtent: d3.geoClipExtent(),
      bounds: d3.geoPath()
        .projection(d3.geoTransform({
          point(x, y, z) {
            this.stream.point(x, y, z);
          },
        })).bounds,
      simplify: d3.geoTransform({
        point(x, y, z) {
          if (z >= projection.area) {
            this.stream.point(
              (x * projection.scale) + projection.translate[0],
              (y * projection.scale) + projection.translate[1],
              z,
            );
          }
        },
      }),
      path: d3.geoPath().projection({
        stream(s) {
          return projection.simplify.stream(projection.clipExtent.stream(s));
        },
      }),
    };

    this.projection = projection;
  }

  /**
   * Calculate bounding box for features
   * @param {Array} features - GeoJSON features
   * @return {Array} - d3 bounding box
   * @access protected
   */
  calcBounds(features) {
    return this.projection.bounds({
      type: 'FeatureCollection',
      features,
    });
  }

  /**
   * Calculate view box for chart layers
   * @param {Array} layers - Chart layers
   * @return {Object}
   * @access protected
   */
  calcViewbox(layers) {
    const bounds = this.calcBounds(layers.reduce((results, layer) => {
      if (layer.shape && layer.shape.features) return results.concat(layer.shape.features);
      return results;
    }, []));

    const center = this.calcCenter({ bounds });

    return { bounds, center };
  }

  /**
   * Calculate center from bounds OR scale AND translate
   * @param {Object} options
   * @param {Number} [options.width=settings.width]
   * @param {Number} [options.height=settings.height]
   * @param {Array} [options.bounds]
   * @param {Number} [options.scale]
   * @param {Number} [options.translate]
   * @return {Array}
   * @access protected
   */
  calcCenter(options) {
    const {
      width = this.settings.width,
      height = this.settings.height,
      bounds,
      scale,
      translate,
    } = options;

    if (bounds) {
      return [
        (bounds[1][0] + bounds[0][0]),
        (bounds[1][1] + bounds[0][1]),
      ];
    }

    if (scale && translate) {
      return [
        (width - (translate[0] * 2)) / scale,
        (height - (translate[1] * 2)) / scale,
      ];
    }

    return [0, 0];
  }

  /**
   * Calculate scale from bounds
   * @param {Object} options
   * @param {Array} options.bounds
   * @param {Number} [options.width=settings.width]
   * @param {Number} [options.height=settings.height]
   * @param {Number} [options.proportion=1] - proportion to scale to
   * @return {Number}
   * @access protected
   */
  calcScale(options) {
    const {
      width = this.settings.width,
      height = this.settings.height,
      proportion = 1,
      bounds,
    } = options;

    return (proportion / Math.max(
      Math.abs(bounds[1][0] - bounds[0][0]) / width,
      Math.abs(bounds[1][1] - bounds[0][1]) / height,
    ));
  }

  /**
   * Calculate translate from center AND scale
   * @param {Object} options
   * @param {Number} options.scale
   * @param {Number} options.translate
   * @param {Number} [options.width=settings.width]
   * @param {Number} [options.height=settings.height]
   * @return {Array}
   * @access protected
   */
  calcTranslate(options) {
    const {
      width = this.settings.width,
      height = this.settings.height,
      scale,
      center,
    } = options;

    return [(width - (scale * center[0])) / 2, (height - (scale * center[1])) / 2];
  }

  /**
   * Build chart dom elements
   * @param {Object} options
   * @param {Object[]} options.layers - Map layers
   * @param {Object} options.layers[].shape - Layer GeoJSON
   * @param {Object} options.layers[].data - Layer values
   * @access public
   */
  render(options) {
    this.svg = d3.select(this.settings.container)
      .append('svg')
      .attr('height', this.settings.height)
      .attr('width', this.settings.width);

    this.zoomed = d3.zoom()
      .on('zoom', () => {
        this.projection.scale = this.zoomed.scale();
        this.projection.translate = this.zoomed.translate();
        this.projection.area = 1 / this.projection.scale / this.projection.scale;

        this.settings.zoom.scale = this.projection.scale - this.viewbox.scale;
        this.settings.zoom.translate = [
          this.projection.translate[0] - this.viewbox.translate[0],
          this.projection.translate[1] - this.viewbox.translate[1],
        ];

        this.paths.attr('d', this.projection.path);
        this.emit('zoom', this.settings.zoom);
      });

    this.update(options);
  }

  /**
   * Update chart dom elements
   * @param {Object} options
   * @param {Object[]} options.layers - Map layers
   * @param {Object} options.layers[].shape - Layer GeoJSON
   * @param {Object} options.layers[].data - Layer values
   * @param {Boolean} [options.animate=true] - Flag to turn off animation
   * @access public
   */
  update(options) {
    const newLayers = options.layers;
    const currentLayers = (this.layers) ? this.layers.data() : [];

    const { animate = true } = options;

    if (newLayers !== undefined) {
      const currentKeys = currentLayers.map(({ key }) => key);
      const newKeys = newLayers.map(({ key }) => key);

      if (!isEqual(currentKeys, newKeys)) {
        this.viewbox = this.calcViewbox(newLayers);
      }

      this.layers = this.svg
        .selectAll('.layer')
        .data(newLayers.map((layer) => {
          layer.style = merge({}, this.settings.style, layer.style);
          return layer;
        }), ({ key }) => key)
        .enter()
        .append('g')
        .attr('class', ({ key }) => `layer layer-${key}`)
        .style('opacity', 0);

      this.transition(this.layers.exit(), animate)
        .style('opacity', 0)
        .remove();

      this.layers.order();

      this.transition(this.layers, animate)
        .style('opacity', 1);

      this.data = this.layers
        .data();

      this.paths = this.layers.selectAll('path');
    }

    this.colorize
      .range(this.colors[this.settings.scale.direction])
      .domain(this.domain());

    this.paths = this.paths.data((layer) => {
      if (!layer.shape || !layer.shape.features) return [];

      const data = layer.data || {};

      return layer.shape.features.map((feature) => {
        const key = feature.properties[this.settings.key] || feature.properties.key;

        feature.layer = layer;
        feature.data = data[key] || {};
        return feature;
      });
    }, d => d.properties.key || d.properties[this.settings.key]);

    this.paths
      .enter()
      .append('path')
      .attr('class', d => this.classes(d).join(' '))
      .attr('d', this.projection.path)
      .call(this.styles.bind(this), true);

    this.transition(this.paths.exit(), animate)
      .style('opacity', 0).remove();

    this.transition(this.paths, animate)
      .attr('class', d => this.classes(d).join(' '))
      .call(this.styles.bind(this));

    // this.resize(this.settings.width, this.settings.height);

    this.nodes = this.paths;

    this.select(undefined, { update: false });
  }

  /**
   * Resize chart to new dimensions
   * @param {Number} newWidth - New width
   * @param {Number} newHeight - New height
   * @access public
   */
  resize(newWidth, newHeight) {
    this.settings.width = newWidth;
    this.settings.height = newHeight;

    const { width, height, proportion } = this.settings;

    this.viewbox.scale = this.calcScale({
      bounds: this.viewbox.bounds,
      proportion,
    });

    this.viewbox.translate = this.calcTranslate({
      scale: this.viewbox.scale,
      center: this.viewbox.center,
    });

    let translate = [
      this.viewbox.translate[0] + this.settings.zoom.translate[0],
      this.viewbox.translate[1] + this.settings.zoom.translate[1],
    ];

    const extent = [
      this.settings.zoom.extent[0] * this.viewbox.scale,
      this.settings.zoom.extent[1] * this.viewbox.scale,
    ];

    let scale = this.viewbox.scale + this.settings.zoom.scale;
    const center = this.calcCenter({ scale, translate });

    this.zoomed.scaleExtent(extent);

    this.projection.clipExtent([[-5, -5], [(width + 10), (height + 10)]]);

    scale = Math.max(extent[0], Math.min(scale, extent[1]));
    translate = this.calcTranslate({ scale, center });

    this.svg
      .attr('height')
      .attr('width')
      .call(this.zoomed.translate(translate).scale(scale))
      .call(this.zoomed.event);
  }

  /**
   * Zoom chart in specified direction or to location
   * @param {String} direction - Zoom direction [in, out, to]
   * @param {Number} [location] - Location key to zoom to when direction == `to`
   * @access public
   */
  zoom(direction, location) {
    let scale = this.zoomed.scale();
    let translate = this.zoomed.translate();
    const extent = this.zoomed.scaleExtent();
    let center = this.calcCenter({ scale, translate });

    switch (direction) {
      case 'reset':
        ({ scale, center } = this.viewbox);
        break;
      case 'in':
        scale *= this.settings.zoom.increment;
        break;
      case 'out':
        scale /= this.settings.zoom.increment;
        break;
      case 'to': {
        let locations;
        let bounds;

        if (location === 'selected') {
          locations = this.settings.selected;
        } else {
          locations = ((location instanceof Array) ? location : [location]).map(Number);
        }

        const features = this.layers
          .data()
          .reduce((results, layer) => results
            .concat(layer.shape.features
              .filter(feature => feature.properties[this.settings.key] &&
              locations.includes(feature.properties[this.settings.key]))), []);

        if (features.length) {
          bounds = this.calcBounds(features);
          scale = this.calcScale({ bounds, proportion: 0.6 });
          center = this.calcCenter({ bounds });
        }
        break;
      }
      default:
        break;
    }

    scale = Math.max(extent[0], Math.min(scale, extent[1]));
    translate = this.calcTranslate({ scale, center });

    this.svg
      .transition()
      .duration(this.settings.animation)
      .call(this.zoomed
        .scale(scale)
        .translate(translate)
        .event);
  }
}
