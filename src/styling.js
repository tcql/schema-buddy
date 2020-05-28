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


module.exports = {
  colors,
  symbols,
  formatArray,
  summaryField,
}
