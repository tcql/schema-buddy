const split = require('binary-split')
const fs = require('fs')
const path = require('path')
const prompts = require('prompts')
const _ = require('lodash')
const yargs = require('yargs')
const v = require('is-my-json-valid')
const util = require('util')
const kleur = require('kleur')
const {
  colors,
  symbols,
  formatArray,
  summaryField,
} = require('./src/styling')

function getSchemaId(schema) {
  return schema['$id']
    || schema['schema']
    || [schema['name'], schema['version']].join('-')
}

async function loadSchemas(schemafile) {
  const availableSchemas = []
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(schemafile)
    stream
      .pipe(split())
      .on('data', l => {
        let schema = JSON.parse(l.toString())
        let id = getSchemaId(schema)
        availableSchemas.push({
          '$id': id,
          version: schema['version'],
          schema: schema
        })
      })
      .on('error', e => {
        stream.close()
        reject(e)
      })
      .on('end', () => resolve(availableSchemas))
  })
}

async function main() {
  const schemapath = path.resolve(process.argv[2])
  const schemas = await loadSchemas(schemapath)

  const infoS = kleur.yellow().italic
  const highlightS = kleur.magenta
  console.log('Found', colors.highlight(schemas.length), 'schemas')

  let choices = _.chain(schemas)
    .sortBy('$id')
    .map(e => ({title: e.$id, value: e.$id}))

  let summarize = schema => {
    const {required, additionalProperties, isPublic, version} = schema.schema
    const props = _.chain(schema.schema.properties)
      .map((prop, key) => ({...prop, __key: key})) // stamp with property name as __key
      .map(({enum: e, type: t, ...prop}) => ({...prop, enum: e, __type: _.castArray(e || t)})) // normalize enum|type => __type, force to array
      .map(({enum: e, __type: t, ...prop}) => ({...prop, __type: e ? t.map(v => JSON.stringify(v)) : t})) // if sources was enum, quote values in __type
      .map(({__key: k, ...prop}) => ({...prop, __key: k, __required: required.indexOf(k) > -1}))
      .orderBy(['__required', '__key'], ['desc', 'asc'])

    const propsPrintable = props
      .map(p => styling.summaryField(p.__key, p.__type, p.__required)) // wrap in styling

    console.log('')
    console.log(kleur.white().bold('Schema Summary'))
    console.log(kleur.bold('--------------'))
    console.log('Version:', kleur.yellow(version))
    console.log('Is public?', isPublic ? styling.symbols.yes : styling.symbols.no)
    console.log('Allows additional properties:', additionalProperties ? styling.symbols.yes : styling.symbols.no)
    console.log('')
    console.log('Fields:')
    console.log(propsPrintable.join('\n').value())
    console.log('')
  }
  // // summarize(_.find(schemas, ['$id', 'appUserTurnstile-2.0']))
  // let sc = _.find(schemas, ['$id', 'appUserTurnstile-2.0'])
  // console.log(_.get(sc, ["schema", "properties", "enabled.telemetry"]))
  // process.exit()
  let input = await prompts([
    {
      type: 'select',
      name: 'command',
      message: 'What would you like to do?',
      choices: [
        { title: 'Validate events against a schema', value: 'validate' },
        { title: 'See an example event for a schema', value: 'example', disabled: true },
        { title: 'Summarize a schema\'s details', value: 'summary' }
      ]
    },
    {
      type: 'autocomplete',
      name: 'schema',
      message: 'Which schema would you like to test?',
      choices: choices.value(),
      format: input => _.find(schemas, ['$id', input]),
      suggest: input => {
        return choices
          .filter(e => e.title.toLowerCase().indexOf(input.toLowerCase()) > -1)
          .value()
      }
    },
    {
      type: (prev, answers) => {
        summarize(prev)
        // if (answers.command !== 'summary') return false
        return false
      }
    },
    {
      type: (_prev, answers) => {
        if (answers.command === 'validate') {
          return 'text'
        }
        return false
      },
      message: 'Enter an event to test',
      name: 'test',
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
    },
  ])

  if (input.command === 'validate') {
    let schema = input.schema
    const validator = v(schema.schema, {verbose: true})
    let tested = validator(input.test)
    if (tested) {
      console.log(styling.symbols.yes, 'The event is valid')
    } else {
      console.log(styling.symbols.no, 'The event is invalid. Errors:')
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

      errors
        .forEach(e => {
          const i = kleur.italic
          const mStyle = i().magenta
          const fStyle = i().underline().cyan
          let message = e.message
          let prop = _.get(schema.schema, e.schemaPath)

          if (e.type) {
            let expectedType = _.castArray(e.type)
            message = `${message}; ${styling.colors.plain("expected type")} ${styling.colors.errors.extra(e.type)}`
          } else if (message.indexOf('enum value') > -1) {
            let enumStr = styling.formatArray(prop.enum, styling.colors.errors.extra, styling.colors.plain(', '))

            message = `${message}; ${plainS("allowed values:")} ${enumStr}`
          }
          console.log(mStyle('Field'), fStyle(e.field), mStyle(message))
        })
        .value()

    }
  }

  // if (input.command === 'summary') {
  //   summarize(input.schema)
  // }
}

main()
