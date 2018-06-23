import * as topojson from 'topojson';
import { merge, intersection, isEqual, memoize } from 'lodash';

import MapChart from '../charts/map';
import MapLegend from '../legends/map.legend';
import MapFilter from './map.filter';

export default class Map {
  constructor(settings, topology) {
    const defaults = {
      legend: false,
      chart: false,
      filter: false,
    };

    this.topology = topology;
    this.cache = {};
    this.settings = merge({}, defaults, settings);

    this.components = {};

    const { chart, legend, filter } = this.settings;

    this.components.chart = new MapChart(chart);

    if (legend) {
      this.components.legend = new MapLegend(legend);
    }

    if (filter) {
      this.components.filter = new MapFilter({
        ...filter,
        extent: this.components.chart.extent(),
      });

      this.components.filter.on('filter', ({
                                             values: newValues,
                                             domain: newDomain,
                                             action,
                                           }) => {
        const values = this.filter();
        const domain = this.domain();

        let update = false;

        if (!isEqual(newValues, values)) {
          this.filter(newValues, { update: false });
          update = true;
        }

        if (!isEqual(newDomain, domain)) {
          this.domain(newDomain, { update: false });
          update = true;
        }

        if (update) {
          this.update({
            animate: (action !== 'filter'),
          });
        }
      });
    }

    this.feature = memoize((layer) => {
      return topojson.feature(this.topology, layer.topology);
    }, (layer) => { return layer.topology; });
  }

  on(event, fn) {
    if (this.components.chart) this.components.chart.on(event, fn);
    if (this.components.legend) this.components.legend.on(event, fn);
    if (this.components.filter) this.components.filter.on(event, fn);
  }

  render(options) {
    const {
      layers, selected, direction, extent,
    } = options;

    if (layers) {
      options.layers = this.layers(layers, selected);
    }

    if (selected) {
      this.select(selected, { update: false });
    }

    if (direction) {
      this.direction(direction, { update: false });
    }

    if (extent) {
      this.extent(extent, { update: false });
    }

    if (this.components.chart) this.components.chart.render(options);
    if (this.components.legend) this.components.legend.render(options);

    if (this.components.filter) {
      this.components.filter.render({
        extent: this.components.chart.extent(),
      });
    }
  }

  update(options = {}) {
    const {
      layers, selected, direction, extent,
    } = options;

    if (layers) {
      options.layers = this.layers(layers, selected);
    }

    if (selected) {
      this.select(selected, { update: false });
    }

    if (direction) {
      this.direction(direction, { update: false });
    }

    if (extent) {
      this.extent(extent, { update: false });
    }

    if (this.components.chart) this.components.chart.update(options);
    if (this.components.legend) this.components.legend.update(options);

    if (this.components.filter) {
      this.components.filter.extent(this.components.chart.extent());
    }
  }

  resize(chart, legend) {
    if (this.components.chart) this.components.chart.resize(chart.width, chart.height);
    if (this.components.legend) this.components.legend.resize(legend.width, legend.height);
  }

  zoom(direction, location) {
    if (this.components.chart) this.components.chart.zoom(direction, location);
  }

  select(location, options) {
    if (this.components.chart) this.components.chart.select(location, options);
    if (this.components.legend) this.components.legend.select(location, options);
  }

  direction(direction, options) {
    if (this.components.chart) this.components.chart.direction(direction, options);
    if (this.components.legend) this.components.legend.direction(direction, options);
  }

  unit(unit, options) {
    if (this.components.chart) this.components.chart.unit(unit, options);
    if (this.components.legend) this.components.legend.unit(unit, options);
  }

  filter(filter, options) {
    if (this.components.chart) {
      if (!filter) return this.components.chart.settings.filter;
      this.components.chart.filter(filter, options);
    }
    if (this.components.legend) {
      if (!filter) return this.components.legend.settings.filter;
      this.components.legend.filter(filter, options);
    }
    return undefined;
  }

  domain(domain, options) {
    if (this.components.chart) {
      if (!domain) return this.components.chart.settings.scale.domain;
      this.components.chart.domain(domain, options);
    }
    if (this.components.legend) {
      if (!domain) return this.components.legend.settings.scale.domain;
      this.components.legend.domain(domain, options);
    }
    return undefined;
  }

  extent(extent, options) {
    if (this.components.chart) this.components.chart.extent(extent, options);
    if (this.components.legend) this.components.legend.extent(extent, options);
    if (this.components.filter) this.components.filter.extent(extent, options);
  }

  layers(layers, selected) {
    const objects = {
      type: 'GeometryCollection',
      geometries: [],
    };

    return layers.map((layer) => {
      objects.geometries.push(layer.topology);
      return {
        ...layer,
        shape: this.feature(layer),
      };
    }).concat(this.meshLayers(objects, selected));
  }

  meshLayers(objects, selected = []) {
    const mesh = topojson.meshes(this.topology, objects, (...matches) => {
      const disputes = [];
      const keys = [];
      const tags = ['borders'];

      matches.forEach(({ properties }) => {
        if (properties.disputes && properties.disputes.length) {
          disputes.push(...properties.disputes);
        } else {
          keys.push(properties.location_id);
        }
      });

      const disputesIntersect = Boolean(intersection(disputes, keys).length);
      const selectedKeysIntersect = Boolean(intersection(selected, keys).length);
      const selectedDisputesIntersect = Boolean(intersection(selected, disputes).length);

      if (matches.length !== 1 && disputesIntersect) {
        tags.push('disputed');
      }

      if ((selectedKeysIntersect && !selectedDisputesIntersect)
        || (!selectedKeysIntersect && selectedDisputesIntersect)
      ) {
        tags.push('selected');
      }

      return tags.join(' ');
    });

    mesh.features = mesh.features.map((feature) => {
      const { tag } = feature.properties;
      return {
        ...feature,
        properties: {
          key: tag,
          class: tag,
        },
      };
    });

    return [{
      key: 'borders',
      shape: mesh,
    }];
  }
}
