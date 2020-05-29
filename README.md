⚠️  **Schema Buddy is super experimental right now!** ⚠️

SB has some serious limitations and is likely to change substantially 

## it's dangerous to go alone

It can be scary to go exploring in a new set of JSON Schemas, but now you've got a buddy to help you out! Schema Buddy can give you a hand when working with [JSONSchema](https://json-schema.org/):

- Validate data against a schema
- See a clean summary of a schema
- Generate some examples from a schema

![](https://github.com/tcql/schema-buddy/blob/master/assets/example.svg)

## usage

```sh
git clone https://github.com/tcql/schema-buddy.git
cd schema-buddy
npm ci
npm start
```

Or, maybe install globally:

```sh
npm link
schema-buddy --help
```

Each sub-command can be called directly and supports skipping prompts by passing in options. For example, you can generate a summary of the `example-1.1` schema like so:

```sh
schema-buddy summarize --file ./example/example-schema.jsonl -s example-1.1
```

## notes

Known issues & limitations:

- SB only reads schemas from a single line-delimited JSON file 
- SB only handles schemas that are `object` type at the top level
- Error handling? What's that?
- No schema dereferencing (yet)