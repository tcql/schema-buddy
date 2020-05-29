const fs = require('fs')
const split = require('binary-split')
const _ = require('lodash')
const kleur = require('kleur')
const {
  colors,
  symbols,
  summaryField
} = require('./styling')


function getSchemaId(schema) {
  return schema['$id']
    || schema['schema']
    || [schema['name'], schema['version']].join('-')
}


// todo: read from other streams than a file, maybe?
async function load(schemafile) {
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


function summarize(schemaInfo) {
  const schema = schemaInfo.schema
  const {required, additionalProperties, isPublic, version} = schema

  // todo: SIMPLIFY more?
  const props = _.chain(schema.properties)
    .map((prop, key) => ({ __key: key, ...prop }))
    .map(({enum: e, ...prop}) => ({ ...prop, __e: e ? e.map(JSON.stringify) : [] })) // enum -> quoted/"literal" values
    .map(({type: t, ...prop}) => ({ ...prop, __type: _.castArray(t) })) // cast type -> array of types, if not already
    .map(({__type: t, __e: e, ...prop}) => ({ ...prop, __type: e.length > 0 ? e : t })) // normalize (enum or type) -> type
    .map(({__key: k, ...prop}) => ({...prop, __key: k, __required: _.includes(required, k)})) // tag as required or not

  const propsPrintable = props
    .orderBy(['__required', '__key'], ['desc', 'asc'])
    .map(p => summaryField(p.__key, p.__type, p.__required))
    .join('\n')

  // TODO:
  // - use templating instead of a bunch of console.log'ing
  // - remove custom property information (isPublic) and/or provide some way to extract
  //   additional properties for summaries
  // - handle if the schema itself is not valid
  console.log('')
  console.log(kleur.white().bold('Schema Summary'))
  console.log(kleur.bold('--------------'))
  console.log('Version:', kleur.yellow(version))
  console.log('Is public?', isPublic ? symbols.yes : symbols.no)
  console.log('Allows additional properties:', additionalProperties ? symbols.yes : symbols.no)
  console.log('')
  console.log('Fields:')
  console.log(propsPrintable.value())
  console.log('')
}


module.exports = {
  load,
  summarize
}
