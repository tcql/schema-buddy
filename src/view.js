const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const _ = require('lodash')
const {
  colors,
  symbols,
} = require('./styling')
const glob = require('glob')

/**
  There are two assets related to rendering content:

  1. View Classes (views for short)
  2. Templates

  View Classes facilitate rendering templates, as well
  as providing convenience helper functions and the ability
  to expose custom formatting functions inside of templates.
  See BaseView.init and BaseView.render for more info.

  Templates can be supplied in two ways:

  1. A .hbs handlebars template file in the `templates` folder
  2. An inline `template()` method on a view class

  This module exists to handle all external interface with
  views. There shouldn't be any reason to manually create
  View classes or load templates directly off disk.

  Any program using the views should call `init()` from this
  module at startup, then use `render(template, context)` to
  show rendered templates
*/

// cache of loaded view classes
const viewCache = {}

// views that are available that
// could be loadeded
let availableViews = {}

function pathToViewInfo(location, stripPattern=null) {
  let {name, dir} = path.parse(location)

  // apply the user supplied stripPattern
  // to clean up the the file name
  let stripped = name.replace(stripPattern, "")

  // replace "/" with "." in path, and
  // kebab-case each folder/part of the path.
  // for example:
  //     folderTo/myView/File
  //
  // becomes:
  //     folder-to.my-view.file
  //
  let cleanedName = path.join(dir, stripped)
    .split("/")
    .map(_.kebabCase)
    .join(".")

  return {
    path: location,
    name: cleanedName,
    template: cleanedName
  }
}

function init() {
  const viewsPath = path.join(__dirname, 'views')
  const views = glob.sync('**/*View.js', {cwd: viewsPath})
  // View classes get assigned directly to `availableViews`
  views
    .map(v => pathToViewInfo(v, /View/))
    // convert the cwd-level path into a full path
    // so we can properly locate the view class
    .map(v => _.assign(v, {'path': path.join(viewsPath, v.path)}))
    .reduce((acc, v) => {
      acc[v.name] = v
      return acc
    }, availableViews)

  let baseViewPath = availableViews["base"].path
  // Remove the "BaseView" since we don't ever want to call
  // `render("base", ...)` anywhere in the code
  delete availableViews["base"]

  const templatesPath = path.join(__dirname, '../templates')
  const templates = glob.sync('**/*.hbs', {cwd: templatesPath})
  // Templates are only assigned if there already isn't
  // a matching View class. This lets us render templates
  // directly if they don't require any additional View
  // manipulation
  templates
    .map(pathToViewInfo)
    // View-less templates will always use the BaseView to
    // handle loading/rendering
    .map(v => _.assign(v, {'path': baseViewPath}))
    .reduce((acc, v) => {
      if (_.has(availableViews, v.name)) return acc
      acc[v.name] = v
      return acc
    }, availableViews)
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
