const fs = require('fs')
const split = require('binary-split')
const _ = require('lodash')


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
    .map(_.partial(_.zipObject, ['key', 'value']))
    .sortBy('key')
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

  const tagKey = (prop, key) => ({key, ...prop})
  const pickTypeOrEnum = ({enum: e, type: t, ...prop}) => {
    // if we pick enum, we want to quote the values
    // so we can indicate that they're literals
    let type = e ? e.map(JSON.stringify) : t
    type = _.castArray(type)
    return {type, ...prop}
  }
  const tagRequired = ({key, ...prop}) => {
    return {key, required: _.includes(required, key), ...prop}
  }
  const simplify = f => _.pick(f, ["key", "type", "required"])

  // TODO:
  // - handle displaying property dependencies
  // - dereferencing schema to get full properties
  // - traverse dependencies for additional properties
  const fields = _.chain(schema.properties)
    .map(tagKey)
    .map(pickTypeOrEnum)
    .map(tagRequired)
    .map(simplify)
    .orderBy(['required', 'key'], ['desc', 'asc'])

  const {
    userProperties,
    coreProperties
  } = summaryHeaderProperties(schema)

  return {
    core: coreProperties.value(),
    user: userProperties.value(),
    fields: fields.value()
  }
}


module.exports = {
  load,
  summarize
}
