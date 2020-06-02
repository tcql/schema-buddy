const _ = require('lodash')
const {
  colors,
  symbols,
  formats
} = require('../styling')

class BaseView {
  formatValue(value, fmt, list_fmt, list_sep) {
    let t = this.findFormatType(value)
    switch (t) {
      case "bool":
        return value ? symbols.yes : symbols.no
        break;
      case "array":
        return this.formatArray(value, list_fmt, list_sep)
        break;
      case "object":
      case "plainobject":
        return JSON.stringify(value)
        break;
      default:
        return fmt(value)
    }
  }


  findFormatType(value) {
    const checks = [
      {type: "array", fn: _.isArray},
      {type: "bool", fn: _.isBoolean},
      {type: "plainobject", fn: _.isPlainObject},
      {type: "object", fn: _.isObject},
      // types that aren't anything ^ are lumped into
      // "string" because they can be printed with no
      // extra formatting.
      {type: "string", fn: _.constant(true)}
    ]
    return _.reduce(checks, (t, c) => t || (c.fn(value) ? c.type : false), false)
  }

  formatArray (arr, itemStyle, separator = null) {
    if (!separator) separator = symbols.listSeparator
    return arr.map(item => itemStyle(item)).join(separator)
  }

  generate(ctx={}) {
    throw new Error("child class must implement generate")
  }

  render(ctx={}) {
    let lines = this.generate(ctx)
    lines = _.flattenDeep(_.castArray(lines))
    lines.forEach(l => console.log(l))
  }
}

module.exports = BaseView
