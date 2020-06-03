const kleur = require('kleur')
const util = require('util')
const _ = require('lodash')

// TODO: are these... good? defaults might be better.
_.assign(util.inspect.styles, {
  name: 'cyan',
  null: 'italic',
  string: 'yellow',
  special: 'magenta',
  symbol: 'yellow',
})

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
  yes: kleur.green('✔'),
  no: kleur.red('✖'),
  listSeparator: colors.plain(' | ')
}


module.exports = {
  colors,
  symbols,
}
