const fs = require('fs')
const split = require('binary-split')
const _ = require('lodash')
const kleur = require('kleur')
const {
  colors,
  symbols,
  summaryField,
  headerProperty,
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


// todo: extract to utils
function _sortedKeyPairs(obj) {
  return _.chain(obj)
    .toPairs()
    .map(_.partial(_.zipObject, ['prop', 'value']))
    .sortBy('prop')
}

function summaryHeaderProperties(schema) {
  const corePropNames = [
    '$id',
    '$schema',
    'title',
    'description',
    'additionalProperties',
  ]

  // we assume schema is an object type
  // so we're ignoring object specific keys
  // that we don't want to print, plus some
  // others that aren't as immediately useful
  const ignoredPropNames = [
    'type',
    'properties',
    'propertyNames',
    'required',
    'dependencies',
    'patternProperties',
  ]
  const nonUserPropNames = _.concat(corePropNames, ignoredPropNames)

  const coreProperties = _sortedKeyPairs(_.pick(schema, corePropNames))
  const userProperties = _sortedKeyPairs(_.omit(schema, nonUserPropNames))

  return {coreProperties, userProperties}
}

// TODO: dereferencing schema to get full properties
function summarize(schemaInfo) {
  const schema = schemaInfo.schema
  const {required} = schema

  // TODO:
  // - SIMPLIFY ?
  // - handle displaying property dependencies
  // - dereferencing schema to get full properties
  // - traverse dependencies for additional properties

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

  const {
    userProperties,
    coreProperties
  } = summaryHeaderProperties(schema)

  const corePropsPrintable = coreProperties
    .map(({prop: p, value: v}) => headerProperty(p, v))
    .join('\n')

  const userPropsPrintable = userProperties
    .map(({prop: p, value: v}) => headerProperty(p, v))
    .join('\n')

  // TODO:
  // - use templating instead of a bunch of console.log'ing
  // - remove custom property information (isPublic) and/or provide some way to extract
  //   additional properties for summaries
  // - handle if the schema itself is not valid
  console.log('')
  console.log(kleur.white().bold('Schema Summary'))
  console.log(kleur.bold('--------------'))
  console.log()
  console.log(colors.highlight('[core metadata]'))
  console.log(corePropsPrintable.value())
  console.log()
  console.log(colors.highlight('[user metadata]'))
  console.log(userPropsPrintable.value())
  console.log('')
  console.log(colors.highlight('[fields]'))
  console.log(propsPrintable.value())
  console.log('')
}


module.exports = {
  load,
  summarize
}
