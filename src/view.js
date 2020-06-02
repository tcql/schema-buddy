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

function flatMapDeep(obj, kpath=null) {
  return _.flatMap(obj, (v, k) => {
    let subpath = _.compact(_.concat(kpath, k))
    return _.isPlainObject(v) ?
      mapDeep(v, subpath) :
      {key: k, value: v, path: kpath}
  })
}


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

// function init() {
//   generateHelpers('c', mapDeep(colors))
//   generateHelpers('s', mapDeep(symbols))
//   generateHelpers('f', mapDeep(formats))

//   Handlebars.registerHelper('matches', function(value, expr) {
//     return value.indexOf(expr) > -1
//   })
//   Handlebars.registerHelper('json', JSON.stringify)
//   Handlebars.registerHelper('array', formatArray)
//   Handlebars.registerHelper('replace', function(options) {
//     const {split, join} = options.hash
//     let out = options.fn(this)
//     return out.replace(new RegExp(split, 'g'), join)
//   })
//   Handlebars.registerHelper('dedent', function(level, options) {
//     if (!level) level = 2
//     const out = options.fn(this)
//     const rexp = new RegExp(`^\\s{0,${level}}`)
//     return out
//       .split('\n')
//       .map(l => l.replace(rexp, ""))
//       .join('\n')
//   })
//   Handlebars.registerHelper('redent', function (level, options) {
//     if (!level && level !== 0) level = 2
//     const out = options.fn(this)
//     const rexp = new RegExp("^\\s+", 'g')
//     const replace = _.fill(_.range(level), " ").join("")
//     return out
//       .split('\n')
//       .map(l => l.replace(rexp, replace))
//       .join('\n')
//   })
//   Handlebars.registerHelper('render', function (tmpl, options) {
//     let ctx = _.isEmpty(options.hash) ? options.data.root : options.hash
//     return render(tmpl, ctx)
//   })
//   Handlebars.registerHelper('br', () => "")

//   loadAllViews()
// }


// function render(tmpl, ctx) {
//   return Handlebars.partials[tmpl](ctx)
// }


// function loadAllViews() {
//   const views = glob.sync('./views/**/*.hbs')
//   views
//     .map(v => {
//       let name = v
//         .replace("./views/", "")
//         .replace('.hbs', "")
//         .replace(/\//g, ".")
//       return {name: name, path: v}
//     })
//     .forEach(({name: n, path: p}) => {
//       const content = fs.readFileSync(p, "utf-8")
//         .replace(/[\n]+$/g, "")
//       Handlebars.registerPartial(n, Handlebars.compile(content))
//     })
// }


module.exports = {
  init,
  render,
}
