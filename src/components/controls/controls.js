/* global document, window, ga, _gaq */

import * as d3 from 'd3';
import $ from 'jquery';

window.jQuery = $;
require('select2');

import 'select2/select2.css';

export default class Controls {
  constructor(settings) {
    this.defaults = {
      container: '#controls',
      gaCategory: 'Uncategorized settings',
    };

    this.values = (typeof settings.values !== 'undefined') ? settings.values : {};
    this.update = (typeof settings.update === 'function') ? settings.update : () => {
    };

    delete settings.values;
    delete settings.update;

    this.settings = $.extend({}, this.defaults, settings);

    this.controls = {};
    this.init();
  }

  init() {
    d3.values(this.settings.controls).forEach((ele) => {
      this.addControl(ele);
    });
  }

  addControl(control) {
    control.controls = this;

    if (typeof this.controls[control.id] === 'undefined') {
      if (control.options && control.options.constructor === Array) {
        control._options = $.extend([], control.options);
        control.options = () => { return control._options; };
      }

      if (typeof control.components !== 'undefined') {
        d3.values(control.components).forEach((component) => {
          component.settings = $.extend(
            {},
            this.getDefaults(component.type, component),
            component.settings,
          );
          this.controls[component.id] = component;
        });
      } else if (control.type === 'buttons') {
        d3.values(control.options()).forEach((button) => {
          button.type = 'button';
          button.buttonsText = control.text;
          button.settings = $.extend(
            {},
            this.getDefaults(button.type, button),
            button.settings,
          );
          this.controls[button.id] = button;
        });
      } else {
        control.settings = $.extend(
          true,
          {},
          this.getDefaults(control.type, control),
          control.settings,
        );
        this.controls[control.id] = control;
      }

      if (typeof this.values[control.id] === 'undefined'
        && typeof control.default !== 'undefined'
      ) {
        this.values[control.id] = control.default;
      }

      control.default = this.values[control.id];

      this.buildControl(control);
    }
  }

  buildControl(control) {
    switch (control.type) {
      case 'header':
        this.buildHeaderWidget(control);
        break;
      case 'select':
        this.buildSelectWidget(control);
        break;
      case 'multi-select':
        this.buildMultiSelectWidget(control);
        break;
      case 'tags':
        this.buildTagsWidget(control);
        break;
      case 'autocomplete':
        this.buildAutocompleteWidget(control);
        break;
      case 'button':
        this.buildButtonWidget(control);
        break;
      case 'buttons':
        this.buildButtonsWidget(control);
        break;
      case 'buttonset':
        this.buildButtonsetWidget(control);
        break;
      case 'slider':
        this.buildSliderWidget(control);
        break;
      case 'range-slider':
        this.buildRangeSliderWidget(control);
        break;
      case 'age':
        this.buildAgeWidget(control);
        break;
      case 'toggle':
        this.buildToggleWidget(control);
        break;
      case 'checkbox':
        this.buildCheckboxWidget(control);
        break;
      case 'input':
        this.buildInputWidget(control);
        break;
      case 'input-set':
        this.buildInputSetWidget(control);
        break;
      case 'wrapper':
        this.buildWrapper(control);
        break;
      case 'menu':
        this.buildMenuWidget(control);
        break;
      default:
        break;
    }
  }

  getDefaults(type, ele) {
    let defaults = {};
    switch (type) {
      case 'multi-select':
        defaults = {
          minimumResultsForSearch: 10,
          formatSelection: (state, container) => {
            return this.formatMultiSelection(state, container, ele);
          },
          formatResult: (state, container) => {
            return this.formatMultiResult(state, container, ele);
          },
          matcher: this.matcher.bind(this),
          dropdownCss: () => {
            return this.dropdownCss(ele);
          },
        };
        break;
      case 'select':
        defaults = {
          minimumResultsForSearch: 10,
          formatSelection: (state, container) => {
            return this.formatSelection(state, container, ele);
          },
          formatResult: this.formatResult,
          matcher: this.matcher,
          dropdownCss: () => {
            return this.dropdownCss(ele);
          },
        };
        break;
      case 'tags':
        defaults = {
          width: '500px',
          tags: true,
          separator: '","',
          maximumSelectionSize: 0,
          formatSelection: (object) => {
            return object.text;
          },
          formatResult: (object, container) => {
            return this.formatResult(object, container);
          },
          initSelection: (element, callback) => {
            const data = [];
            let defaultValues = $.trim(element.val());

            defaultValues = defaultValues.split('","');
            $(defaultValues).each((index, value) => {
              const part = value.split(':', 2);
              data.push({ id: value, text: part[1] });
            });
            element.val('');
            callback(data);
          },
        };
        break;
      default:
        break;
    }
    return defaults;
  }

  getHTMLid(control, part, option) {
    const { chart } = this.settings;

    const components = [];
    if (this.settings.id) components.push(this.settings.id);
    if (part) components.push(part);
    if (control.type) components.push(control.type);
    if (control.id) components.push(control.id);
    if (option) components.push(option);
    if (chart) components.push(chart);

    return components.join('-');
  }

  getHTMLclass(control, part, option) {
    const components = [];
    if (part) components.push(part);
    if (control.type) components.push(`${components[components.length - 1]}-${control.type}`);
    if (control.id) components.push(`${components[components.length - 1]}-${control.id}`);
    if (option) components.push(`${components[components.length - 1]}-${option}`);

    return components.join(' ');
  }

  changeValue(cid, newValue, shouldTrack, event = {}) {
    let value = newValue;
    let track = shouldTrack;

    const control = this.controls[cid];
    const $control = $(`#${this.getHTMLid(control, 'control')}`);

    const option = (typeof control.options !== 'undefined') ? control.options().filter((o) => {
      return o.id == value;
    })[0] : {};

    event.value = value;

    if (typeof track === 'undefined') {
      if (!option) {
        track = false;
      } else if (typeof option.track !== 'undefined') {
        ({ track } = option);
      } else {
        track = true;
      }
    }

    let val;
    let values;

    switch (control.type) {
      case 'multi-select':
        values = this.values[control.id].slice() || [];
        value = ($.isArray(value)) ? value.slice() : value;

        if (!$.isArray(value)) {
          if (values.includes(value)) {
            event.type = 'remove';
            values.splice(values.indexOf(value), 1);
          } else {
            event.type = 'add';
            values.push(value);
          }

          value = values;
        }

        this.values[control.id] = value;

        if (!value.length) $(`#${this.getHTMLid(control, 'control')}`).select2('val', '');
        else $(`#${this.getHTMLid(control, 'control')}`).select2('val', value[0]);
        $control.val('');

        track = false;
        break;
      case 'select':
        $control.select2('val', value);
        break;
      case 'buttonset':
        if (control.settings.multiple && value && value.constructor === Array) {
          $(`#${this.getHTMLid(control, 'control')} input`).prop('checked', false);
          value.forEach((v) => {
            $(`#${this.getHTMLid(control, 'control')} [value="${v}"]`)
              .prop('checked', true)
              .button('refresh');
          });
        } else if (value) {
          $(`#${this.getHTMLid(control, 'control')} input`).prop('checked', false);
          $(`#${this.getHTMLid(control, 'control')} [value="${value}"]`).prop('checked', true);
          $(`#${this.getHTMLid(control, 'control')}`).buttonset('refresh');
        }
        break;
      case 'slider':
        if (this.values[control.id] != value) {
          this.values[control.id] = value;

          $control.slider('value', (typeof control.options !== 'undefined') ?
            control.options().map((o) => { return o.id; }).indexOf(value) : value);
        } else {
          this.values[control.id] = value;
          $control.trigger('updateLabel');
        }

        break;
      case 'tags':
        if (control.settings.data) {
          val = value.map((d) => {
            return (typeof d !== 'object') ? control.settings.data.filter((c) => {
              return c.id == d;
            })[0] : d;
          });
        } else if (control.settings.query) {
          val = value.map((d) => {
            return (typeof d !== 'object') ? control.settings.query().filter((c) => {
              return c.id == d;
            })[0] : d;
          });
        }

        if (this.values) {
          this.values[control.id] = value;
        }

        if (typeof control.value === 'function') {
          control.value(control, value);
        }

        $control.select2('data', val).select2('close');

        if (typeof control.refresh === 'function') {
          control.refresh(control, value);
        }

        value = val;
        break;
      case 'range-slider': {
        const oldValue = this.values[control.id];

        if (value != undefined) {
          if (oldValue[0] != value[0] || oldValue[1] != value[1]) {
            this.values[control.id] = value;

            $control.dragslider('values', (typeof control.options !== 'undefined')
              ? value.map((v) => {
                return control.options().map((o) => {
                  return o.id;
                }).indexOf(v);
              }) : value);
          } else {
            this.values[control.id] = value;
            $control.trigger('updateLabel');
          }
        }

        break;
      }
      case 'autocomplete':
        if (value) {
          $control.val(control.options().filter((d) => {
            return d.id == value;
          })[0].text);
          $control.blur();
        } else $(`#${this.getHTMLid(control, 'control')}`).val('');
        break;
      case 'toggle':
        $(`#${this.getHTMLid(control, 'control')} input`).bootstrapSwitch('state', value, false);
        break;
      case 'checkbox':
        $control.prop('checked', value);
        break;
      default:
        break;
    }

    this.values[control.id] = value;

    if (typeof control.valueChange === 'function') {
      control.valueChange(control, value);
    }

    if (track !== false) {
      this.trackEvent(control, value);
    }

    return { value, event };
  }

  changeSetting(cid, value, event, track) {
    const control = this.controls[cid];
    const v = this.changeValue(control.id, value, track, event);

    if (typeof control.change === 'function') {
      if (control.change(control, v.value, v.event) === false) {
        return;
      }
    }

    this.update(control, v.value, v.event);
  }

  updateOptions(cid, options) {
    const control = this.controls[cid];
    if (control._options !== undefined && typeof options !== 'undefined') {
      control._options = options;
    }

    const $control = $(`#${this.getHTMLid(control, 'control')}`);

    switch (control.type) {
      case 'multi-select':
      case 'select':
        $control.empty();
        this.buildSelectOptions(control, $control);
        if (control.type === 'select') {
          $control.select2('val', this.values[control.id]);
        }
        break;
      case 'tags':
        this.getHTMLid(control, 'control').select2(control.settings);
        break;
      case 'range-slider':
        if (options.min !== undefined) {
          control.min = options.min;
          $control.dragslider('option', 'min', control.min);
        }
        if (options.max !== undefined) {
          control.max = options.max;
          $control.dragslider('option', 'max', control.max);
        }
        if (options.step !== undefined) {
          control.step = options.step;
          $control.dragslider('option', 'step', control.step);
        }

        break;
      default:
        break;
    }
  }

  trackEvent(control, val) {
    if (typeof this.controls[control.id] !== 'undefined') {
      let name = this.controls[control.id].text;
      let value = val;

      const category = this.settings.gaCategory;

      switch (control.type) {
        case 'button':
          if (typeof control.buttonsText !== 'undefined') {
            name = control.buttonsText;
            value = control.text;
          }
          break;
        case 'slider':
        case 'range-slider':
          value = [].concat((typeof control.options !== 'undefined') ?
            control.options().map((o) => {
              return o.id;
            }).indexOf(value) :
            value).map((v) => {
            return control.value(v);
          });

          break;
        case 'checkbox':
        case 'toggle':
          if (value) {
            if (typeof control.on !== 'undefined') value = control.on;
            else value = 'On';
          } else if (typeof control.off !== 'undefined') value = control.off;
          else value = 'Off';
          break;
        case 'tags':
          value = value.map((d) => { return d.text; });
          break;
        default:
          if (typeof this.controls[control.id].options === 'function') {
            value = control.options().filter((d) => { return d.id == value; })[0].text;
          }
          break;
      }

      if (typeof _gaq !== 'undefined') {
        _gaq.push(['_trackEvent', category, name, value]);
      }

      if (typeof ga !== 'undefined') {
        ga('send', 'event', category, name, value);
      }
    }
  }

  buildWrapper(ele) {
    const container = $('<div>').appendTo(this.settings.container)
      .attr('id', this.getHTMLid(ele, 'control-container'))
      .attr('class', `${this.getHTMLclass(ele, 'control-container')} clearfix`);

    if (typeof ele.visibility !== 'undefined') {
      container.attr('cv', ele.visibility);
    }

    return $('<div>').appendTo(container)
      .attr('id', this.getHTMLid(ele, 'control-wrapper'))
      .attr('class', `${this.getHTMLclass(ele, 'control-wrapper')} clearfix`);
  }

  buildCheckbox(ele, wraper) {
    const checkbox = $('<input/>')
      .attr('id', this.getHTMLid(ele, 'control'))
      .attr('type', 'checkbox')
      .attr('value', ele.id)
      .attr('class', this.getHTMLclass(ele, 'control'));

    if (ele.default) {
      checkbox.prop('checked', true);
    }

    if (ele.text) {
      wraper.append($('<label>')
        .attr('for', this.getHTMLid(ele, 'control'))
        .attr('class', this.getHTMLclass(ele, 'control-label'))
        .text(ele.text));
    }

    wraper.append(checkbox);

    return checkbox;
  }

  buildLabel(ele, wraper) {
    return $('<span>').appendTo(wraper)
      .attr('id', this.getHTMLid(ele, 'control-label'))
      .attr('class', this.getHTMLclass(ele, 'control-label'))
      .text(ele.text);
  }

  buildValue(ele, wraper) {
    return $('<span>').appendTo(wraper)
      .attr('id', this.getHTMLid(ele, 'control-value'))
      .attr('class', this.getHTMLclass(ele, 'control-value'));
  }

  buildSlider(ele, wraper) {
    return $('<div>').appendTo(wraper)
      .attr('id', this.getHTMLid(ele, 'control'))
      .attr('class', this.getHTMLclass(ele, 'control'));
  }

  buildInput(ele, wraper) {
    return $('<input>').appendTo(wraper)
      .attr('id', this.getHTMLid(ele, 'control'))
      .attr('class', this.getHTMLclass(ele, 'control'));
  }

  buildSelectOptions(ele, select) {
    if (typeof ele.settings.placeholder !== 'undefined') {
      select.append($('<option>'));
    }
    $(ele.options(this.settings.chart)).each((index, {
      id, text, match, bold, distance, enabled = true,
    }) => {
      const option = $('<option>')
        .attr('value', id)
        .attr('id', this.getHTMLid(ele, 'control', id))
        .attr('disabled', ((!enabled)))
        .attr('match-text', (match) || text)
        .css({
          'font-weight': ((bold) ? 'bold' : ''),
          'margin-left': (distance) ? (distance * 5) : '0',
        })
        .text(text)
        .appendTo(select);

      d3.selectAll(option).datum({
        disabled: ((!enabled)),
        'match-text': (match) || text,
        css: {
          'font-weight': ((bold) ? 'bold' : ''),
          'margin-left': (distance) ? (distance * 5) : 0,
        },
      });
    });
  }

  buildSelect(ele, wraper) {
    const self = this;
    const select = $('<select>').appendTo(wraper)
      .attr('id', self.getHTMLid(ele, 'control'))
      .attr('class', self.getHTMLclass(ele, 'control'));

    self.buildSelectOptions(ele, select);
    return select;
  }

  buildButtonset(ele, wraper) {
    const buttonset = $('<div>').appendTo(wraper)
      .attr('id', this.getHTMLid(ele, 'control'))
      .attr('class', this.getHTMLclass(ele, 'control'));
    $(ele.options()).each((inddx, option) => {
      const button = $('<input/>')
        .attr('type', ((ele.settings.multiple) ? 'checkbox' : 'radio'))
        .attr('name', this.getHTMLid(ele, 'control'))
        .attr('value', option.id)
        .attr('id', this.getHTMLid(ele, 'control-option', option.id));
      if ((ele.settings.multiple && ele.default.includes(option.id)) || ele.default == option.id) {
        button.prop('checked', true);
      }
      button.click((event) => {
        let value;
        if (ele.settings.multiple) {
          const controlId = this.getHTMLid(ele, 'control');

          value = [];
          $(`input:checkbox[name=${controlId}]:checked`).each((index, input) => {
            value.push($(input).val());
          });
        } else {
          value = $(event.target).val();
        }

        this.changeSetting(ele.id, value, event);
      });

      buttonset.append(button);
    });

    $(ele.options()).each((index, option) => {
      const label = $('<label>')
        .attr('class', this.getHTMLclass(ele, 'control-option', option.id))
        .attr('for', this.getHTMLid(ele, 'control-option', option.id))
        .text(option.text);

      if (typeof option.attrs !== 'undefined') {
        d3.entries(option.attrs).forEach((a) => {
          const attrs = label.attr(a.key);
          label.attr(a.key, ((attrs) ? `${attrs} ` : '') + a.value);
        });
      }

      buttonset.append(label);
    });

    return buttonset;
  }

  buildButton(ele, wraper) {
    const button = $('<button>')
      .attr('id', this.getHTMLid(ele, 'control'))
      .attr('class', this.getHTMLclass(ele, 'control'))
      .text(ele.text);

    button.button();
    button.click((e) => {
      this.changeSetting(ele.id, '', e);
    });

    wraper.append(button);

    return button;
  }

  buildSliderWidget(ele) {
    const wraper = this.buildWrapper(ele);
    this.buildLabel(ele, wraper);
    const slider = this.buildSlider(ele, wraper);
    const value = $('<span>');

    let val = ele.default;

    if (typeof ele.options !== 'undefined') {
      const options = ele.options();

      ele.min = 0;
      ele.max = options.length - 1;
      val = options.map((o) => { return o.id; }).indexOf(val);
      if (typeof ele.value !== 'function') {
        ele.value = (i) => { return (options[i]) ? options[i].text : ''; };
      }
    }

    if (typeof ele.value !== 'function') {
      ele.value = (id) => { return id; };
    }

    slider.slider({
      value: val,
      min: ele.min,
      max: ele.max,
      step: (ele.step) ? ele.step : 1,
      slide: (event, ui) => {
        value.text(ele.value(ui.value));
      },
      change: (event, ui) => {
        value.text(ele.value(ui.value));
        if (event.originalEvent) {
          this.changeSetting(
            ele.id,
            (typeof ele.options !== 'undefined') ?
              ele.options()[ui.value].id : ui.value,
            event,
          );
        }
      },
    });

    value.appendTo($('.ui-slider-handle', slider));

    slider.on('updateLabel', () => {
      value.text(ele.value(slider.slider('value')));
    });

    slider.trigger('updateLabel');
  }

  buildRangeSliderWidget(ele) {
    const wraper = this.buildWrapper(ele);
    this.buildLabel(ele, wraper);
    const slider = this.buildSlider(ele, wraper);
    const values = [$('<span>'), $('<span>')];
    let val = ele.default;

    if (typeof ele.options !== 'undefined') {
      ele.min = 0;
      ele.max = ele.options().length - 1;

      if (val) {
        val = val.map((v) => {
          return ele.options().map((o) => {
            return o.id;
          }).indexOf(v);
        });
      }
      if (typeof ele.value !== 'function') {
        ele.value = (i) => { return ele.options()[i].text; };
      }
    }

    if (typeof ele.value !== 'function') {
      ele.value = (id) => { return id; };
    }

    slider.dragslider({
      animate: true,
      range: true,
      rangeDrag: true,
      values: val,
      min: ele.min,
      max: ele.max,
      step: (ele.step) ? ele.step : 1,
      change: (event, ui) => {
        if (ui.values[0] === ui.values[1]) {
          return false;
        }

        const $control = $(`#${this.getHTMLid(ele, 'control')}`);

        if (ele.threshold) {
          const width = $control.width();
          const min = $control.dragslider('option', 'min');
          const max = $control.dragslider('option', 'max');

          if ((((ui.values[1] - ui.values[0]) / (max - min)) * width) <= ele.threshold) {
            return false;
          }
        }

        const value = (typeof ele.options !== 'undefined') ?
          ui.values.map((v) => {
            return ele.options()[v].id;
          }) : ui.values;

        values.forEach((v, i) => {
          v.text(ele.value(ui.values[i]));
        });

        if (event.originalEvent) {
          this.changeSetting(ele.id, value, event);
        }

        return true;
      },
      slide: (event, ui) => {
        values.forEach((v, i) => {
          v.text(ele.value(ui.values[i]));
        });
      },
    });

    values.forEach((v, i) => {
      v.appendTo($('.ui-slider-handle', slider)[i]);
    });

    slider.on('updateLabel', () => {
      values.forEach((v, i) => {
        v.text(ele.value(slider.dragslider('values')[i]));
      });
    });

    slider.trigger('updateLabel');
  }

  buildButtonsetWidget(ele) {
    const wraper = this.buildWrapper(ele);
    this.buildLabel(ele, wraper);
    const buttonset = this.buildButtonset(ele, wraper);
    buttonset.buttonset();

    $(ele.options()).each((index, option) => {
      if (option.icon) {
        $(`#${this.getHTMLid(ele, 'control-option', option.id)}`)
          .button({ icons: { primary: option.icon } });
      }
    });
  }

  buildButtonWidget(ele) {
    const wraper = this.buildWrapper(ele);
    this.buildButton(ele, wraper);
  }

  buildToggleWidget(ele) {
    const wraper = this.buildWrapper(ele);
    this.buildLabel(ele, wraper);
    const toggle = this.buildCheckbox($.extend({}, ele, { text: false, type: 'checkbox' }), wraper)
      .attr('data-on-text', (typeof ele.on !== 'undefined') ? ele.on : 'On')
      .attr('data-off-text', (typeof ele.off !== 'undefined') ? ele.off : 'Off')
      .bootstrapSwitch('size', 'small');

    toggle.parent().parent().wrap($('<div/>')
      .attr('id', this.getHTMLid(ele, 'control'))
      .attr('class', this.getHTMLclass(ele, 'control'))).addClass();

    toggle.on('switchChange.bootstrapSwitch', (event, value) => {
      this.changeSetting(ele.id, value, event);
    });
  }

  buildCheckboxWidget(ele) {
    const wraper = this.buildWrapper(ele);
    const checkbox = this.buildCheckbox(ele, wraper);

    checkbox.click((event) => {
      this.changeSetting(ele.id, $(event.target).prop('checked'), event);
    });
  }

  buildButtonsWidget(ele) {
    const wraper = this.buildWrapper(ele);
    this.buildLabel(ele, wraper);

    $(ele.options()).each((index, opt) => {
      this.buildButton(opt, wraper);
    });
  }

  buildSelectWidget(ele) {
    const wraper = this.buildWrapper(ele);
    this.buildLabel(ele, wraper);
    const select = this.buildSelect(ele, wraper);

    select.val(ele.default);
    select.select2(ele.settings);

    select
      .on('select2-open', () => {
        this.selectOpen();
      })
      .on('select2-opening', () => {
        this.closeSelect();
      });

    select.change((event) => {
      this.changeSetting(ele.id, event.target.value, event);
    });
  }

  buildMultiSelectWidget(ele) {
    const wraper = this.buildWrapper(ele);
    this.buildLabel(ele, wraper);
    const select = this.buildSelect(ele, wraper);

    if (ele.default) {
      this.values[ele.id] = ele.default;
      select.val(ele.default[0]);
    }

    select.select2(ele.settings);
    select.val('');

    select
      .on('select2-open', () => {
        this.selectOpen();
        this.buildSelectFilterBar();
      })
      .on('select2-opening', () => {
        this.closeSelect();
      })
      .on('select2-clearing', (e) => {
        this.changeSetting(ele.id, [], e);
      })
      .on('select2-selecting', (e) => {
        const values = (this.values[ele.id]) ? this.values[ele.id] : [];
        const val = parseInt(e.val, 10);

        if (values.includes(val)) {
          $(`#control-result-${val} input`).prop('checked', false);
        } else {
          $(`#control-result-${val} input`).prop('checked', true);
        }

        this.changeSetting(ele.id, val, e, false);

        e.stopPropagation();
        e.preventDefault();
        return false;
      });
  }

  buildSelectFilterBar() {
    const $search = $('#select2-drop .select2-search');

    if (!$('.select2-filter', $search).length) {
      const $filter = $('<div/>', { class: 'select2-filter' });

      $filter.append(
        $('<button/>', {
          class: 'select2-filter-option active',
          value: 'all',
        }).text('All options'),
        $('<button/>', {
          class: 'select2-filter-option',
          value: 'selected',
        }).text('Selected options'),
      );

      $search.append($filter);

      $filter.on('click', ({ target }) => {
        const $target = $(target);
        $('.select2-filter-option', $filter).removeClass('active');
        $target.addClass('active');

        if ($target.attr('value') === 'selected') {
          $('#select2-drop input:not(:checked)').parents('.select2-result').hide();
        } else {
          $('#select2-drop .select2-result').show();
        }
      });
    } else {
      $('.select2-filter-option', $search).removeClass('active');
      $('.select2-filter-option[value="all"]', $search).addClass('active');
    }
  }

  buildTagsWidget(ele) {
    const wrapper = this.buildWrapper(ele);
    this.buildLabel(ele, wrapper);
    const input = this.buildInput(ele, wrapper);

    input.val(ele.default);
    input.select2(ele.settings);

    input
      .on('select2-open', () => {
        this.selectOpen();
      })
      .on('select2-opening', () => {
        this.closeSelect();
      })
      .on('choice-selected', (e, choice) => {
        if (typeof ele.choiceSelected === 'function') {
          ele.choiceSelected($(choice).data('select2-data'));
        }
      });

    input.change((e) => {
      this.changeSetting(ele.id, input.select2('val'), e);
    });
  }

  buildAutocompleteWidget(ele) {
    const wraper = this.buildWrapper(ele);
    const input = this.buildInput(ele, wraper);
    this.buildLabel(ele, wraper);

    $(input).autocomplete({
      source: ele.options().map((d) => {
        return ({
          id: d.id,
          value: d.text,
        });
      }),
      select(event, ui) {
        this.changeSetting(ele.id, ui.item.id, event);
      },
    });

    $(input).focus((e) => {
      this.changeSetting(ele.id, '', e);
    });

    $(input).click((e) => {
      this.changeSetting(ele.id, '', e);
    });
  }

  buildInputSetWidget(ele) {
    const wraper = this.buildWrapper(ele);
    this.buildLabel(ele, wraper);

    ele.options().forEach((opt, i) => {
      this.buildLabel($.extend({}, ele, opt), wraper);
      const input = this.buildInput($.extend({}, ele, opt), wraper);

      if (ele.default && ele.default.constructor === Array && ele.default[i]) {
        input.val(ele.default[i]);
      }
      $(input).change((e) => {
        const values = [];
        $(`#${this.getHTMLid(ele, 'control-wrapper')} input`).each((index, option) => {
          values.push($(option).val());
        });
        this.changeSetting(ele.id, values, e);
      });
    });
  }

  buildMenuWidget(ele) {
    const wraper = this.buildWrapper(ele);
    this.buildLabel(ele, wraper);
    this.buildMenu(ele, wraper);
  }

  buildMenu(ele, wraper) {
    const menu = $('<ul>').appendTo(wraper)
      .attr('id', this.getHTMLid(ele, 'control'))
      .attr('class', this.getHTMLclass(ele, 'control'));

    this.buildMenuOptions(ele, menu);

    return menu;
  }

  buildMenuOptions(ele, menu) {
    $(ele.options()).each((index, item) => {
      const option = menu.append($('<li>')
        .attr('value', this.id)
        .attr('id', this.getHTMLid(ele, 'control', item.id))
        .append($('<span>')
          .text(item.text)));

      if (typeof item.options !== 'undefined') {
        this.buildMenu(item, option);
      }
    });
  }

  markMatch(text, term, markup) {
    const match = text.toUpperCase()
      .indexOf(term.toUpperCase());

    const tl = term.length;

    if (match < 0) {
      markup.push(text);
      return;
    }

    markup.push(text.substring(0, match));
    markup.push("<span class='select2-match'>");
    markup.push(text.substring(match, match + tl));
    markup.push('</span>');
    markup.push(text.substring(match + tl, text.length));
  }

  formatSelection(state, container) {
    $(container).parent().parent().attr('title', state.text);

    return state.text;
  }

  formatResult(state, container) {
    if (typeof state.element !== 'undefined') {
      $(container).attr('style', state.element[0].style.cssText);
    }

    if (state.element[0].disabled) {
      $(container).addClass('disabled');
      $(container).parent('li').removeClass('select2-result-selectable');
    }

    return state.text;
  }

  matcher(term, text, option) {
    const matchText = $(option).attr('match-text');

    if (typeof matchText !== 'undefined') {
      return matchText.toUpperCase().includes(term.toUpperCase());
    }

    return false;
  }

  formatMultiSelection(state, container, ele) {
    $(container).addClass('select2-default');

    const values = this.values[ele.id];

    if (values.length) {
      state.text = `${ele.settings.placeholder} (${values.length})`;
    }

    return this.formatSelection(state, container, ele);
  }

  formatMultiResult(state, container, ele) {
    const values = this.values[ele.id];
    const checked = (values !== undefined && values.includes(parseInt(state.id, 10)));
    let style = '';
    let margin;
    let weight;

    if (typeof state.element !== 'undefined') {
      const option = d3.select(state.element[0]).datum();

      if (option.disabled) {
        const $container = $(container);
        $container.addClass('disabled');
        $container.parent('li').removeClass('select2-result-selectable');
      }

      margin = ((option.css['margin-left']) ?
        (`${option.css['margin-left'] + 20}px`) : '20px');

      weight = option.css['font-weight'];
    }

    if (weight) style += `font-weight: ${weight};`;
    if (margin) style += `margin-left: ${margin};`;

    return `
      <div class="control-result" id="control-result-${state.id}">
        <input type="checkbox" ${(checked) ? 'checked' : ''}/>
        <span style="${style}">${state.text}</span>
      </div>
    `;
  }

  dropdownCss(ele) {
    let styles = $('#control-styles');
    if (!styles.length) styles = $('<style/>', { id: 'control-styles' }).appendTo($('head'));

    const select = $(`#s2id_${this.getHTMLid(ele, 'control')}`);
    const offset = select.offset();
    const above = select.hasClass('select2-drop-above');

    const css = {
      'border-bottom-right-radius': '0',
      'border-bottom-left-radius': '0',
      'border-top-right-radius': '0',
      'border-top-left-radius': '0',
      'border-top': '',
    };

    if (ele.settings.dropWidth) {
      let { dropWidth } = ele.settings;

      if (dropWidth.charAt(0) === '+') {
        dropWidth = parseFloat(dropWidth.substring(1, dropWidth.length), 10) + select.width();
      }

      if (dropWidth > select.width()) {
        const direction = ele.settings.dropDirection || 'left';

        if (((above && direction === 'right') || !above)) {
          css['border-bottom-right-radius'] = '4px';
        }

        if (((above && direction === 'left') || !above)) {
          css['border-bottom-left-radius'] = '4px';
        }

        if (((!above && direction === 'right') || above)) {
          css['border-top-right-radius'] = '4px';
        }

        if (((!above && direction === 'left') || above)) {
          css['border-top-left-radius'] = '4px';
        }

        css['border-top'] = '1px solid #ccc';
        css.width = dropWidth;
        css[direction] = (offset[direction] - (dropWidth - select.outerWidth()));
      }
    }

    const $window = $(window);
    const $document = $(document);
    const windowHeight = $window.height();
    const documentHeight = $document.height();
    const windowTop = $window.scrollTop();
    const windowBottom = (documentHeight - windowHeight - windowTop);
    let top = offset.top - windowTop;
    let bottom = ((windowHeight + windowTop) - offset.top - select.height());
    const header = (windowTop > 30) ? 0 : (30 - windowTop);
    const footer = (windowBottom > 25) ? 0 : (25 - windowBottom);
    const searchHeight = (ele.type === 'multi-select') ? 56 : 30;

    top -= header;
    bottom -= footer;

    const height = (
      !above && (bottom >= top || (offset.top + top <= (windowHeight + windowTop)))
    ) ? bottom : top;

    styles.html(`.select2-results{max-height:${height - (searchHeight + 19)}px;}`);

    return css;
  }

  selectOpen() {
    $('#select2-drop-mask').remove();
    $('body').on('click', ({ target }) => {
      if (target.id !== 'loader') {
        this.closeSelect();
      }
    });
  }

  closeSelect() {
    const dropdown = $('#select2-drop').data('select2');

    if (dropdown) dropdown.close();
  }
}
