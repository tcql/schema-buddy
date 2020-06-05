const test = require("tap").test,
  schema = require("../src/schema"),
  path = require("path"),
  _ = require("lodash"),
  glob = require("glob"),
  fs = require("fs")

const fixturesPath = path.join(__dirname, "fixtures")

function loadJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"))
}

function compareJsonFixturesFrom(frompath, compareWith) {
  let inpath = path.join(frompath, "in")
  let outpath = path.join(frompath, "out")
  let infiles = glob.sync("**/*.json", { cwd: inpath })
  infiles.forEach(f => {
    let inFixt = loadJSON(path.join(inpath, f))
    let outFixt = loadJSON(path.join(outpath, f))
    compareWith(inFixt, outFixt, f)
  })
}

test("schema -- getName", t => {
  let with_id = { $id: "id-schemaid" }
  let with_schema = { schema: "schema-schemaid" }
  let with_name = { name: "name-schemaid" }
  let with_no_known = { noid: "there's no id!" }

  t.equal(schema.getName(with_id), "id-schemaid")
  t.equal(schema.getName(with_schema), "schema-schemaid")
  t.equal(schema.getName(with_name), "name-schemaid")
  t.notOk(schema.getName(with_no_known))
  t.end()
})

test("schema -- getVersion", t => {
  let with_dollar_version = { $version: "1.0" }
  let with_version = { version: "7.7" }
  let with_no_known = { noversion: "there's no version" }

  t.equal(schema.getVersion(with_dollar_version), "1.0")
  t.equal(schema.getVersion(with_version), "7.7")
  t.notOk(schema.getVersion(with_no_known))
  t.end()
})

test("load", async t => {
  let schemas = await schema.load(
    path.resolve("./test/fixtures/example-schema.jsonl")
  )
  let schemaMetadata = schemas.map(s => _.pick(s, "$id", "$version", "$name"))
  let expected = [
    { $id: "example-1.1", $version: "1.1", $name: "example" },
    { $id: "second-schema", $version: null, $name: "second-schema" },
  ]
  t.equal(schemas.length, 2)
  t.deepEqual(expected, schemaMetadata)
  t.end()
})

test("schema -- summarize", t => {
  let summarizeFixtures = path.join(fixturesPath, "schemas.summarize")
  compareJsonFixturesFrom(summarizeFixtures, (inFixt, outFixt, filename) => {
    let message = `fixture: ${filename.replace(".json", "")}`
    t.deepEqual(outFixt, schema.summarize(inFixt), message)
  })
  t.end()
})
