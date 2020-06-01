const prompts = require('prompts')
const {summarize} = require('../schema')
const v = require('is-my-json-valid')
const kleur = require('kleur')
const _ = require('lodash')
const {render} = require('../templating')
const {
  colors,
  symbols,
  formatArray,
  validationError,
} = require('../styling')
const {
  toCli,
  toInteractive,
  askWithDefaults,
  schemaSelectInputs,
} = require('../input')

let selectInputs = schemaSelectInputs()

const options = {
  file: selectInputs.file,
  schema: selectInputs.schema,
  placeholderSummarize: {
    interactive: {
      type: (_prev, answers) => {
        summarize(answers.schema)
      }
    }
  },
  event: {
    cli: {type: 'string'},
    interactive: {
      type: 'text',
      message: 'Enter an event to test',
      validate: input => {
        try {
          let asJson = JSON.parse(input)
          return true
        } catch {
          return false
        }
      },
      format: input => {
        return JSON.parse(input)
      }
    }
  }
}

exports.builder = toCli(options)
exports.description = "Validate an event against a schema"
exports.handler = async (argv) => {
  const input = await askWithDefaults(argv, toInteractive(options))
  const {schema} = input.schema

  const validator = v(schema, {verbose: true})
  let tested = validator(input.event)

  let errors = _.chain(validator.errors)
    .sortBy('field')
    .map(e => {
      if (e.field.indexOf('data.') > -1) {
        e.field = e.field.replace('data.', '')
      } else if (e.field.indexOf('data[') > -1) {
        e.field = e.field.replace(/data\["(.*?)"\]/, '$1')
      }
      return e
    })
    console.log(render("validation", {valid: tested, errors: errors}))
}