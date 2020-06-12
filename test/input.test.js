const test = require("tap").test,
  input = require("../src/input"),
  path = require("path"),
  _ = require("lodash"),
  glob = require("glob"),
  fs = require("fs")

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
    ],
    "returns an array containing prompts interactive options"
  )
  t.end()
})
