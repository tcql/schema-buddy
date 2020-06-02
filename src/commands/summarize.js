const prompts = require('prompts')
const {summarize} = require('../schema')
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
  schema: selectInputs.schema
}

exports.builder = toCli(options)
exports.description = "Summarize a schema"
exports.handler = async (argv) => {
  const input = await askWithDefaults(argv, toInteractive(options))
  const {schema} = input.schema

  let summary = summarize(input.schema)
  render('summarize', {schema, summary})
}
