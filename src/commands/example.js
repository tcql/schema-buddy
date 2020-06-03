const prompts = require('prompts')
const kleur = require('kleur')
const jsf = require('json-schema-faker')
const {render} = require('../view')
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
}

exports.builder = toCli(options)
exports.description = "Generate some example events for a schema"
exports.handler = async (argv) => {
  const input = await askWithDefaults(argv, toInteractive(options))

  const exampleSchema = {
    type: 'array',
    items: input.schema,
    minItems: 3,
    maxItems: 3
  }
  await jsf.resolve(exampleSchema).then(examples => {
    render("example", {examples})
  })
}
