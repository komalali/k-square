import $ from 'jquery';
import d3 from 'd3';
import Emitter from 'events';
import { merge, isEqual } from 'lodash';

import Controls from './controls';

export default class MapFilter extends Emitter {
  constructor(settings) {
    super();

    const defaults = {
      extent: [0, 1],
      values: [false, false],
      domain: [false, false],
      format: (value) => {
        return value;
      },
    };

    this.settings = merge({}, defaults, settings);
  }

  render(options) {
    this.settings.extent = options.extent;

    this.filter = new Controls({
      id: this.settings.chart,
      container: this.settings.container,
      update: (control) => {
        this.update(control);
      },
      controls: {
        filter: {
          id: 'filter',
          text: 'Filter',
          type: 'range-slider',
          min: 0,
          max: 1,
          step: 1 / 100000,
          value: (value) => {
            if (!this.filter) return value;

            const { extent, format } = this.settings;

            const filterControlId = this.filter.getHTMLid(this.filter.controls.filter, 'control');

            const scale = d3.scale.linear()
              .domain([0, 1])
              .range(extent);

            const { style } = $(`#${filterControlId} .ui-slider-range`)[0];
            const left = parseFloat(style.left.replace('%', ''));
            const width = parseFloat(style.width.replace('%', ''));

            $(`#${filterControlId} .cover-left`)
              .css({ right: `${100 - left}%` });

            $(`#${filterControlId} .cover-right`)
              .css({ left: `${width + left}%` });

            const scaledValue = scale(value);

            return format(scaledValue);
          },
          threshold: 32,
          change: (control, value) => {
            this.settings.values = value.slice();
          },
          default: [0, 1],
        },
        set: {
          id: 'set',
          type: 'button',
          text: 'Set scale',
          change: () => {
            this.settings.domain = this.settings.values.slice();
          },
        },
        reset: {
          id: 'reset',
          type: 'button',
          text: 'Reset',
          change: () => {
            this.settings.values = [false, false];
            this.settings.domain = [false, false];
          },
        },
      },
      settings: { gaCategory: 'GBD Compare' },
    });

    const filterControlId = this.filter.getHTMLid(this.filter.controls.filter, 'control');

    const $filterControl = $(`#${filterControlId}`);

    $filterControl
      .append($('<div>', { class: 'cover-left' }))
      .append($('<div>', { class: 'cover-right' }))
      .dragslider({ animate: false });

    this.update();
  }

  update(control = {}) {
    const { values, domain, extent } = this.settings;

    const scale = d3.scale.linear()
      .domain([0, 1])
      .range(extent);

    this.settings.values = [
      (values[0] !== false && values[0] > 0 && values[0] < 1) ? values[0] : false,
      (values[1] !== false && values[1] > 0 && values[1] < 1) ? values[1] : false,
    ];

    this.settings.domain = [
      (domain[0] !== false && domain[0] > 0 && domain[0] < 1) ? domain[0] : false,
      (domain[1] !== false && domain[1] > 0 && domain[1] < 1) ? domain[1] : false,
    ];

    this.filter.changeValue('filter', [
      (this.settings.values[0] || 0),
      (this.settings.values[1] || 1),
    ]);

    const disabled = (
      this.settings.values[0] === false &&
      this.settings.values[1] === false &&
      this.settings.domain[0] === false &&
      this.settings.domain[1] === false
    );

    const resetControlId = this.filter.getHTMLid(this.filter.controls.reset, 'control');

    $(`#${resetControlId}`).prop('disabled', disabled);

    this.emit('filter', {
      values: [
        this.settings.values[0] === false ? false : scale(this.settings.values[0]),
        this.settings.values[1] === false ? false : scale(this.settings.values[1]),
      ],
      domain: [
        this.settings.domain[0] === false ? false : scale(this.settings.domain[0]),
        this.settings.domain[1] === false ? false : scale(this.settings.domain[1]),
      ],
      action: control.id,
    });
  }

  extent(extent) {
    if (!isEqual(extent, this.settings.extent)) {
      this.settings.extent = extent;
      if (this.filter) {
        this.update();
      }
    }
  }
}
