const BaseView = require('./BaseView')
const _ = require('lodash')
const {
  colors,
  symbols,
} = require('../styling')

class ValidateView extends BaseView {
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
      console.log("PROP", schemaProperty)
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

  generate({valid, schema, errors}) {
    let validMsg = valid ?
      `${symbols.yes} The event is valid.` :
      `${symbols.no} The event is invalid.`

    this.__schema = schema

    let errMsg = errors
      .map(e => this.renderMessage(e))
      .value()

    return [validMsg, "", errMsg]
  }
}

module.exports = ValidateView
