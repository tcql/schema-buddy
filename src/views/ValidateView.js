const BaseView = require('./BaseView')
const _ = require('lodash')
const {
  colors,
  symbols,
} = require('../styling')

class ValidateView extends BaseView {

  "?message" ({message: m, field: f, type: t, schemaPath: s}, schema) {
    let schemaProperty = _.get(schema, s)
    let field = this.renderField(f)
    let message = m
    let extra = this.renderExtra(t, m, schemaProperty) || ""
    return colors.errors.message(`Field ${field} ${message}. ${extra}`)
  }


  renderField(field) {
    if (field.indexOf('data.') > -1) {
      field = field.replace('data.', '')
    } else if (field.indexOf('data[') > -1) {
      field = field.replace(/data\["(.*?)"\]/, '$1')
    }
    return colors.errors.field(field)
  }


  renderExtra(type, message, schemaProperty) {
    if (type && message !== "is required") {
      let value = this.formatValue(type,
        colors.errors.extra,
        colors.errors.extra,
        symbols.listSeparator
      )
      return `${colors.plain('Expected type')} ${value}`
    } else if (message.indexOf('enum value') > -1) {
      let enumValues = schemaProperty.enum.map(JSON.stringify)
      let value = this.formatArray(enumValues, colors.errors.extra, colors.plain(', '))
      return `${colors.plain('Allowed values:')} ${value}`
    }
  }


  renderMessage({message: m, field: f, type: t, schemaPath: s, ...rest}) {
    let schemaProperty = _.get(this.__schema, s)
    let field = this.renderField(f)
    let message = m
    let extra = this.renderExtra(t, m, schemaProperty) || ""
    return colors.errors.message(`Field ${field} ${message}. ${extra}`)
  }
}

module.exports = ValidateView
