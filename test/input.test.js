const test = require("tap").test,
  input = require("../src/input"),
  path = require("path"),
  _ = require("lodash"),
  glob = require("glob"),
  fs = require("fs"),
  prompts = require("prompts")

let opts = {
  file: {
    cli: {
      type: "string",
      alias: "f",
      default: "./schemas.json",
    },
    interactive: {
      type: "text",
      message: "Where are your schemas located?",
    },
  },
  nocli: {
    interactive: {
      type: "text",
    },
  },
  nointeractive: {
    cli: {
      type: "string",
    },
  },
}

// converts generalized options struct -> yargs cli format
test("input -- toCli", t => {
  t.deepEqual(
    input.toCli(opts),
    {
      file: {
        type: "string",
        alias: "f",
        default: "./schemas.json",
      },
      nointeractive: {
        type: "string",
      },
    },
    "returns an object containing CLI options"
  )
  t.end()
})

// converts generalized options struct -> prompts interactive format
test("input -- toInteractive", t => {
  t.deepEqual(
    input.toInteractive(opts),
    [
      {
        type: "text",
        name: "file",
        message: "Where are your schemas located?",
      },
      {
        type: "text",
        name: "nocli",
      },
    ],
    "returns an array containing prompts interactive options"
  )
  t.end()
})

test("input -- askWithDefaults", async t => {
  let defaults = {
    overridden: "override_with_default",
  }
  let questions = [
    {
      type: "text",
      name: "overridden",
      message: "this will be overridden by defaults",
    },
    {
      type: "text",
      name: "injected",
      message: "this will be injected by test",
    },
  ]
  prompts.inject(["used_from_prompt_because_no_default"])
  let responses = await input.askWithDefaults(defaults, questions)
  t.deepEqual(
    {
      overridden: "override_with_default",
      injected: "used_from_prompt_because_no_default",
    },
    responses
  )
  t.end()
})

test("input -- schemaSelectInputs (file select)", async t => {
  const questions = input.schemaSelectInputs()
  const fileInput = questions.file.interactive

  t.equal(
    "Location must be a valid file path",
    await fileInput.validate("some/fake/location"),
    "returns validation message if file doesn't exist"
  )
  t.equal(true, await fileInput.validate(__filename), "true if the file exists")

  const searchFolder =
    path.resolve(path.join(__dirname, "fixtures/input.schemaSelectInputs")) +
    "/"
  t.deepEqual(
    [
      { title: `${searchFolder}a.json` },
      { title: `${searchFolder}b.json` },
      { title: `${searchFolder}c` },
    ],
    await fileInput.suggest(searchFolder),
    "suggest finds files within the search folder"
  )

  const formatted = fileInput.format(
    "./test/fixtures/input.schemaSelectInputs/a.json"
  )
  t.equal(`${searchFolder}a.json`, formatted, "format resolves path")
  t.end()
})

test("input -- schemaSelectInputs (schema select)", async t => {
  const questions = input.schemaSelectInputs()
  const schemaInput = questions.schema.interactive
  const inputData = questions._data
  inputData.schemas = [{ $id: "abc" }, { $id: "xyz" }]
  inputData.schemaChoices = _.chain([
    { title: "abc", value: "abc" },
    { title: "xyz", value: "xyz" },
    { title: "abc2", value: "abc2" },
  ])
  t.deepEqual({ $id: "xyz" }, schemaInput.format("xyz"))
  t.deepEqual(
    [
      { title: "abc", value: "abc" },
      { title: "abc2", value: "abc2" },
    ],
    schemaInput.suggest("ab")
  )

  t.end()
})
