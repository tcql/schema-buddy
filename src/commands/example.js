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
  await jsf.resolve(exampleSchema).then(sample => {
    // const warning = "Note: Example events *technically* conform to the JSON schema type "
    // + "and formatting rules, but may not be representative of what real events look like.\n\n"
    // + "If your schema only validates types and doesn't supply strict formatting, then the example "
    // + "events may look strange (e.g. - dates as strings without strict formats may produce invalid dates)"

    // console.log(kleur.magenta(warning))
    // console.log(sample.map(e => e.schema))
    render("example", {examples: sample.map(e => e.schema)})
  })
}
