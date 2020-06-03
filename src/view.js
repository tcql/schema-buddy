const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const _ = require('lodash')
const {
  colors,
  symbols,
} = require('./styling')
const glob = require('glob')

// cache of loaded view classes
const viewCache = {}

// views that are available that
// could be loadeded
let availableViews = {}

function pathToViewInfo(p, stripPattern=null) {
  let n = path.parse(p).name
  let name = _.kebabCase(n.replace(stripPattern, ""))
  return {
    path: p,
    name: name,
    template:name
  }
}


function init() {
  const views = glob.sync(path.join(__dirname, 'views/**/*View.js'))
  views
    .map(v => pathToViewInfo(v, /View/))
    .reduce((acc, v) => {
      acc[v.name] = v
      return acc
    }, availableViews)

  let baseViewPath = availableViews["base"].path

  const templates = glob.sync(path.join(__dirname, '../templates/**/*.hbs'))
  templates
    .map(pathToViewInfo)
    .map(v => _.assign(v, {'path': baseViewPath}))
    .reduce((acc, v) => {
      if (_.has(availableViews, v.name)) return acc
      acc[v.name] = v
      return acc
    }, availableViews)

  delete availableViews["base"]
}


function load(viewname) {
  const view = _.get(viewCache, viewname)
  if (view) {
    return view
  }
  if (!_.has(availableViews, viewname)) {
    throw new Error(`No view named ${viewname}`)
  }

  const {name, path: viewpath, template} = _.get(availableViews, viewname)
  const klass = require(viewpath)
  _.set(viewCache, name, new klass(template))
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
