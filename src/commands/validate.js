const prompts = require("prompts")
const { summarize } = require("../schema")
const v = require("is-my-json-valid")
const _ = require("lodash")
const {
  toCli,
  toInteractive,
  askWithDefaults,
  schemaSelectInputs,
} = require("../input")
const { render } = require("../view")

let selectInputs = schemaSelectInputs()

const options = {
  file: selectInputs.file,
  schema: selectInputs.schema,
  placeholderSummarize: {
    interactive: {
      type: (_prev, answers) => {
        const summary = summarize(answers.schema)
        render("summarize", { schema: answers.schema.schema, summary })
      },
    },
  },
  event: {
    cli: { type: "string" },
    interactive: {
      type: "text",
      message: "Enter an event to test",
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
      },
    },
  },
}

exports.builder = toCli(options)
exports.description = "Validate an event against a schema"
exports.handler = async argv => {
  const input = await askWithDefaults(argv, toInteractive(options))
  const { schema } = input.schema

  const validator = v(schema, { verbose: true })
  let tested = validator(input.event)

  let errors = _.chain(validator.errors).sortBy("field")

  render("validate", { valid: tested, errors: errors, schema: schema })
}
