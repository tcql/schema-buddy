const fs = require("fs")
const path = require("path")
const os = require("os")
const glob = require("glob")
const prompts = require("prompts")
const _ = require("lodash")
const { load } = require("./schema")

function toCli(options) {
  let args = {}

  for (let key in options) {
    let elem = options[key]
    if (!elem.cli) continue

    args[key] = elem.cli
  }
  return args
}

function toInteractive(options) {
  let questions = []

  for (let key in options) {
    let elem = options[key]
    if (!elem.interactive) continue

    questions.push(Object.assign({ name: key }, elem.interactive))
  }
  return questions
}

async function askWithDefaults(argv, questions, onCancel) {
  if (!onCancel && onCancel !== false) {
    onCancel = () => {
      console.log("Aborted prompt")
      process.exit()
    }
  }

  prompts.override(argv)

  let input = await prompts(questions, { onCancel: onCancel })

  return Object.assign(argv, input)
}

function schemaSelectInputs() {
  let defaultChoices = _.range(5)
  let inputConfig = {
    _data: {
      schemas: {},
      schemaChoices: _.chain([]),
    },
  }
  let data = inputConfig._data

  inputConfig.file = {
    cli: {
      type: "string",
      alias: "f",
    },
    interactive: {
      type: "autocomplete",
      message: "Where is the line-delimited schema file located?",
      limit: 5,
      initial: "./",
      choices: defaultChoices,
      validate: value =>
        fs.existsSync(path.resolve(value))
          ? true
          : "Location must be a valid file path",
      suggest: async val => {
        val = val.replace("~", os.homedir())
        return glob.sync(`${val}*`).map(f => {
          return { title: f }
        })
      },
      format: value => path.resolve(value),
    },
  }
  inputConfig.schema = {
    cli: {
      type: "string",
      alias: "s",
    },
    interactive: {
      type: async (prev, answers) => {
        if (answers.file) {
          data.schemas = await load(answers.file)
          data.schemaChoices = _.chain(data.schemas)
            .sortBy("$id")
            .map(e => ({ title: e.$id, value: e.$id }))

          return "autocomplete"
        }
        return false
      },
      name: "schema",
      message: "Which schema would you like to test?",
      choices: defaultChoices,
      format: input => _.find(data.schemas, ["$id", input]),
      suggest: input => {
        return data.schemaChoices
          .filter(e => e.title.toLowerCase().indexOf(input.toLowerCase()) > -1)
          .value()
      },
    },
  }
  return inputConfig
}

module.exports = {
  toCli,
  toInteractive,
  askWithDefaults,
  schemaSelectInputs,
}
