const kleur = require('kleur')
const _ = require('lodash')

// basic color/style mapping
// every entry should be an un-called kleur function or chain.
// no additional formatting belongs in this object! this is so
// we can consistently reference color/style for a given purpose
// to build formatting rules
const colors = {
  plain: kleur.reset().white,
  title: kleur.white().bold,
  highlight: kleur.magenta,

  // schema summary printing
  summary: {
    fields: {
      key: kleur.cyan,
      type: kleur.italic().yellow,
      required: kleur.bold().cyan
    },
    field: kleur.cyan,
    requiredField: kleur.bold().cyan,
    fieldType: kleur.italic().yellow,

    header: {
      key: kleur.white,
      value: kleur.yellow,
    },
    // todo: remove
    // headerProperty: kleur.white,
    // headerValue: kleur.yellow,
    // headerValueList: kleur.italic().yellow,
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

  // pre-colored shortcuts; todo: move to formats
  yes: kleur.green('✔'),
  no: kleur.red('✖'),
  listSeparator: colors.plain(' | ')
}

// Formatting!
// Each entry should return a function that takes input properties
// and returns a styled string. It's perfectly acceptable for a format
// to return an entry for `colors` directly if nothing additional is
// required to format a field
const formats = {
  summary: {
    header: {
      key: colors.summary.header.key,
      value: _.partialRight(
        formatValue,
        colors.summary.header.value,
        colors.summary.header.value().italic,
        symbols.listSeparator
      ),
    },
    fields: {
      key: colors.summary.fields.key,
      type: _.partialRight(
        formatValue,
        colors.summary.fields.type,
        colors.summary.fields.type,
        symbols.listSeparator
      ),
    }
  }
}

function formatValue(value, fmt, list_fmt, list_sep) {
  let t = findFormatType(value)
  switch (t) {
    case "bool":
      return value ? symbols.yes : symbols.no
      break;
    case "array":
      return formatArray(value, list_fmt, list_sep)
      break;
    case "object":
    case "plainobject":
      return JSON.stringify(value)
      break;
    default:
      return fmt(value)
  }
}

function findFormatType(value) {
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


// function headerProperty(prop, value) {
//   let propStyled = colors.summary.headerProperty(prop)
//   let valueStyled;
//   if (_.isBoolean(value)) {
//     valueStyled = value ? symbols.yes : symbols.no
//   } else if (_.isArray(value)) {
//     valueStyled = formatArray(
//       value,
//       colors.summary.headerValueList,
//       symbols.listSeparator
//     )
//   } else if (_.isObject(value)) {
//     // TODO: better handling
//     valueStyled = JSON.stringify(value)
//   } else {
//     valueStyled = colors.summary.headerValue(value)
//   }
//   return `${prop}: ${valueStyled}`
// }


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
  formats,
  formatArray,
  summaryField,
  // headerProperty,
  validationError,
}
