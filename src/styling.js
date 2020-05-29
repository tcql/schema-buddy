const kleur = require('kleur')
const _ = require('lodash')

const colors = {
  plain: kleur.reset().white,
  header: kleur.white().bold,
  highlight: kleur.magenta,

  // schema summary printing
  summary: {
    field: kleur.cyan,
    requiredField: kleur.bold().cyan,
    fieldType: kleur.italic().yellow,

    headerProperty: kleur.white,
    headerValue: kleur.yellow,
    headerValueList: kleur.italic().yellow,
  },

  // validation errors
  errors: {
    message: kleur.italic().magenta,
    field: kleur.underline().cyan,
    extra: kleur.italic().yellow
  }
}


const symbols = {
  check: '✔',
  cross: '✖',

  // pre-colored shortcuts
  yes: kleur.green('✔'),
  no: kleur.red('✖'),
  listSeparator: colors.plain(' | ')
}


function formatArray (arr, itemStyle, separator = null) {
  if (!separator) separator = symbols.listSeparator
  return arr.map(item => itemStyle(item)).join(separator)
}


function summaryField(field, types, required = false, indent = 2) {
  // required fields show a symbol at the star, so they have 1 fewer indents
  let spaces = "".padStart(required ? (indent - 1) : indent)
  let typeStyled = formatArray(types, colors.summary.fieldType, symbols.listSeparator)
  let fieldStyled = required ?
    `${symbols.yes}${spaces}${colors.summary.requiredField(field)}` :
    `${spaces}${colors.summary.field(field)}`

  return `${fieldStyled} ${typeStyled}`
}


function headerProperty(prop, value) {
  let propStyled = colors.summary.headerProperty(prop)
  let valueStyled;
  if (_.isBoolean(value)) {
    valueStyled = value ? symbols.yes : symbols.no
  } else if (_.isArray(value)) {
    valueStyled = formatArray(
      value,
      colors.summary.headerValueList,
      symbols.listSeparator
    )
  } else if (_.isObject(value)) {
    // TODO: better handling
    valueStyled = JSON.stringify(value)
  } else {
    valueStyled = colors.summary.headerValue(value)
  }
  return `${prop}: ${valueStyled}`
}


function validationError(schema, field, type, message, schemaPath = []) {
  let prop = _.get(schema, schemaPath)

  if (type && message !== 'is required') {
    let expectedType = formatArray(_.castArray(type), colors.errors.extra, colors.plain(', '))
    message = `${message}. ${colors.plain('Expected type')} ${expectedType}`
  } else if (message.indexOf('enum value') > -1) {
    let enumV = prop.enum.map(JSON.stringify)
    let enumStr = formatArray(enumV, colors.errors.extra, colors.plain(', '))
    message = `${message}. ${colors.plain('Allowed values:')} ${enumStr}`
  }

  return `${colors.errors.message('Field')} ${colors.errors.field(field)} ${colors.errors.message(message)}`
}


module.exports = {
  colors,
  symbols,
  formatArray,
  summaryField,
  headerProperty,
  validationError,
}
