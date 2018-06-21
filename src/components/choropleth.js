import * as d3 from 'd3';
import * as topojson from 'topojson';
import {
  concat,
  merge,
} from 'lodash';
import { extractFeatures } from '../utils';

export default class Choropleth {
  constructor(props) {
    const defaultProps = {
      animation: 750,
      containerDivId: 'chart',
      height: 600,
      topologyUrl: './topo.json',
      width: 800,
      zoomPadding: {
        bottom: 10,
        left: 10,
        right: 10,
        top: 10,
      },
    };

    this.props = merge({}, defaultProps, props);
  }

  async fetchTopojson() {
    const { topologyUrl } = this.props;

    this.props.topology = await d3.json(topologyUrl);
    console.log(this.props.topology);
  }

  renderMap() {
    const {
      containerDivId,
      height,
      topology,
      width,
    } = this.props;

    this.container = d3.select(`#${containerDivId}`);
    this.path = d3.geoPath();

    const features = {
      admin0: extractFeatures(topology, 'admin0'),
      admin0_disputes: extractFeatures(topology, 'admin0_disputes'),
      admin1: extractFeatures(topology, 'admin1'),
      admin1_disputes: extractFeatures(topology, 'admin1_disputes'),
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

    this.buildLayer(features.admin0, 'admin0', 'country');
    this.buildLayer(features.admin0_disputes, 'disputes', 'dispute');
    this.buildLayer(features.admin1, 'admin1', 'subnat');
    this.buildLayer(features.admin1_disputes, 'disputes', 'dispute');
  }

  buildLayer(featureLayer, layerClassName, className) {
    this.mapGroup
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

  async render() {
    await this.fetchTopojson();
    this.renderMap();
  }
}
