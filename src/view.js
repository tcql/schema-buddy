const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const _ = require('lodash')
const {
  colors,
  symbols,
} = require('./styling')
const glob = require('glob')

const viewCache = {}
let availableViews = {}

function init() {
  const views = glob.sync(path.join(__dirname, 'views/**/*View.js'))
  availableViews = views
    .map(v => ({
      path: v,
      name: v.replace(/.*?\/(\w+)View\.js/, "$1").toLowerCase()
    }))
    .filter(v => v.name !== "base")
    .reduce((acc, v) => {
      acc[v.name] = v
      return acc
    }, {})
}


function load(viewname) {
  const view = _.get(viewCache, viewname)
  if (view) {
    return view
  }
  if (!_.has(availableViews, viewname)) {
    throw new Error(`No view named ${viewname}`)
  }

  const {name, path: viewpath} = _.get(availableViews, viewname)
  const klass = require(viewpath)
  _.set(viewCache, name, new klass())
  return _.get(viewCache, name)
}


function render(view, ctx={}) {
  return load(view).render(ctx)
}


module.exports = {
  init,
  load,
  render,
}
