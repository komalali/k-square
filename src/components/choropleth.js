import * as topojson from 'topojson';
import {
  event,
  geoIdentity,
  geoPath,
  geoTransform,
  json,
  select,
  zoom,
  zoomIdentity,
} from 'd3';
import {
  bindAll,
  merge,
} from 'lodash';
import { extractFeatures } from '../utils';

export default class Choropleth {
  constructor(props) {
    const defaultProps = {
      animation: 750,
      containerDivId: 'chart',
      height: 540,
      proportion: 0.95,
      topologyUrl: './topo.json',
      width: 1000,
      zoom: {
        extent: [0.3, 50],
        scale: 0,
        translate: [0, 0],
        increment: 1.5,
      },
    };

    this.props = merge({}, defaultProps, props);

    const projection = {
      area: 1,
      scale: 1,
      translate: [0, 0],
      clip: geoIdentity().clipExtent(),
      bounds: geoPath()
        .projection(geoTransform({
          point(x, y, z) {
            this.stream.point(x, y, z);
          },
        })).bounds,
      simplify: geoTransform({
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
      path: geoPath()
        .projection({
          stream(s) {
            return projection.simplify.stream(projection.clip.stream(s));
          },
        }),
    };

    this.projection = projection;

    bindAll(this, [
      'toggleZoom',
    ]);
  }

  buildLayer(featureLayer, layerClassName, className) {
    return this.mapGroup
      .append('g')
      .attr('class', layerClassName)
      .selectAll('g')
      .data(featureLayer)
      .enter()
      .append('path')
      .attr('d', this.path)
      .attr('class', className)
      .attr('id', datum => `${className}_${datum.properties.loc_id}`);
  }

  async fetchTopojson() {
    const { topologyUrl } = this.props;

    this.props.topology = await json(topologyUrl);
  }

  toggleZoom(d) {
    const {
      mapGroup,
      path,
      svg,
    } = this;
    const {
      animation,
      height,
      width,
    } = this.props;

    const bounds = path.bounds(d);
    const selectedLocation = select(event.target);
    const isCurrentlyActive = selectedLocation.classed('active');

    function zoomed() {
      // mapGroup.style('stroke-width', `${8 / event.transform.k}px`);
      mapGroup.attr('transform', event.transform);
    }

    const zoomer = zoom()
      .scaleExtent([1, 8])
      .on('zoom', zoomed);

    if (isCurrentlyActive) {
      selectedLocation
        .classed('active', false);

      svg
        .transition()
        .duration(animation)
        .call(zoomer.transform, zoomIdentity);

      select('.mesh')
        .style('stroke', 'lightblue');
    } else {
      selectedLocation
        .classed('active', true);

      select('.mesh')
        .style('stroke', 'none');

      const boundParams = {
        dx: bounds[1][0] - bounds[0][0],
        dy: bounds[1][1] - bounds[0][1],
        x: (bounds[0][0] + bounds[1][0]) / 2,
        y: (bounds[0][1] + bounds[1][1]) / 2,
        get scale() {
          const xScale = this.dx / width;
          const yScale = this.dy / height;
          return Math.max(1, Math.min(8, 0.9 / Math.max(xScale, yScale)));
        },
        get translate() {
          return [width / 2 - this.scale * this.x, height / 2 - this.scale * this.y];
        },
      };

      svg
        .transition()
        .duration(animation)
        .call(zoomer.transform, zoomIdentity
          .translate(boundParams.translate[0], boundParams.translate[1])
          .scale(boundParams.scale));
    }
  }

  renderMap() {
    const {
      containerDivId,
      height,
      topology,
      width,
    } = this.props;

    this.container = select(`#${containerDivId}`);
    this.path = geoPath();

    const features = {
      admin0: extractFeatures(topology, 'admin0'),
      admin0_disputes: extractFeatures(topology, 'admin0_disputes'),
      admin1: extractFeatures(topology, 'admin1'),
      admin1_disputes: extractFeatures(topology, 'admin1_disputes'),
      mesh: topojson.mesh(topojson.presimplify(topology), topology.objects.admin0),
    };

    this.svg = this.container
      .append('svg')
      .attr('width', `${width}px`)
      .attr('height', `${height}px`)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    this.mapGroup = this.svg
      .append('g')
      .attr('class', 'map');

    this.mapGroup
      .append('g')
      .attr('class', 'mesh')
      .append('path')
      .attr('d', this.path(features.mesh));

    this.countryGroup = this.buildLayer(features.admin0, 'admin0', 'country');
    this.countryGroup
      .on('click', this.toggleZoom);

    // this.buildLayer(features.admin0_disputes, 'admin0_disputes', 'dispute');
    // this.buildLayer(features.admin1, 'admin1', 'subnat');
    // this.buildLayer(features.admin1_disputes, 'admin1_disputes', 'dispute');
  }

  async render() {
    await this.fetchTopojson();
    this.renderMap();
  }
}
