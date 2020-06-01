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
    metadata: {
      key: kleur.white,
      value: kleur.yellow,
    },
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
    metadata: {
      key: colors.summary.metadata.key,
      value: _.partialRight(
        formatValue,
        colors.summary.metadata.value,
        colors.summary.metadata.value().italic,
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
    },
  },
  errors: {
    type: _.partialRight(
      formatValue,
      colors.errors.extra,
      colors.errors.extra,
      symbols.listSeparator
    ),
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
  validationError,
}
