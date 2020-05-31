const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const _ = require('lodash')
const {
  colors,
  symbols,
  formats,
  formatArray,
} = require('./styling')

const tmplCache = {}


function mapDeep(obj, kpath=null) {
  return _.flatMap(obj, (v, k) => {
    let subpath = _.compact(_.concat(kpath, k))
    return _.isPlainObject(v) ?
      mapDeep(v, subpath) :
      {key: k, value: v, path: kpath}
  })
}

function generateHelpers(prefix, functionList) {
  functionList.forEach(({key: k, value: v, path: p}) => {
    let helperName = _.compact(_.concat(prefix, p, k)).join(':')
    Handlebars.registerHelper(helperName, function (options) {
      if (!options) {
        return v(options)
      } else if (options.fn) {
        // if it's used as a block helper...
        return v(options.fn(this))
      } else {
        if (!_.isFunction(v)) return v
        // if it's used inline
        return v(options || this)
      }
    })
  })
}

function init() {
  generateHelpers('c', mapDeep(colors))
  generateHelpers('s', mapDeep(symbols))
  generateHelpers('f', mapDeep(formats))
  Handlebars.registerHelper('json', JSON.stringify)
  Handlebars.registerHelper('array', formatArray)
  Handlebars.registerHelper('replace', function(options) {
    console.log("replace:",options)
    const {split, join} = options.hash
    let out = options.fn(this)
    return out.replace(new RegExp(split, 'g'), join)
  })
  Handlebars.registerHelper('dedent', function(level, options) {
    if (!level) level = 2
    const out = options.fn(this)
    const rexp = new RegExp(`^\\s{0,${level}}`)
    return out
      .split('\n')
      .map(l => l.replace(rexp, ""))
      .join('\n')
  })
  Handlebars.registerHelper('redent', function (level, options) {
    if (!level && level !== 0) level = 2
    const out = options.fn(this)
    const rexp = new RegExp("^\\s+")
    const replace = _.fill(_.range(level), " ").join("")
    return out
      .split('\n')
      .map(l => l.replace(rexp, replace))
      .join('\n')
  })
  Handlebars.registerHelper('render', function (tmpl, options) {
    let ctx = _.isEmpty(options.hash) ? options.data.root : options.hash
    return render(tmpl, ctx)
  })
}


function load(tmpl) {
  if (!tmplCache[tmpl]) {
    const tmplClean = tmpl.replace(/\./g, '/')
    const loc = path.resolve(`./templates/${tmplClean}.hbs`)
    const content = fs.readFileSync(loc, "utf-8").replace(/[\n]+$/g, "")
    const compiled = Handlebars.compile(content)
    tmplCache[tmpl] = compiled
  }
  return tmplCache[tmpl]
}


function render(tmpl, ctx) {
  return load(tmpl)(ctx)
}


module.exports = {
  init,
  load,
  render,
}
