const _ = require('lodash')
const hbs = require('handlebars')
const {
  colors,
  symbols,
  formats
} = require('../styling')
const fs = require('fs')
const path = require('path')
const util = require('util')

// this is weird here?
function mergelines(data) {
  return _.flattenDeep(_.castArray(data)).join('\n')
}

function keysDeep(obj, kpath=null) {
  return _.flatMap(obj, (v, k) => {
    let subpath = _.compact(_.concat(kpath, k))
    return _.isPlainObject(v) ?
      keysDeep(v, subpath) :
      {key: k, value: v, path: kpath}
  })
}

function generateWrapHelpers(handlebars, prefix, functionList) {
  functionList.forEach(({key: k, value: v, path: p}) => {
    let helperName = _.compact(_.concat(prefix, p, k)).join(':')
    handlebars.registerHelper(`$${helperName}`, function (options) {
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

class BaseView {
  constructor(template) {
    this.init()
    this.templateName = template
  }


  init() {
    this.hbs = hbs.create()

    // Create helper methods for any class methods that are prefixed with "?"
    // This lets us write fairly terse templates that call isolated helpers
    // to generate more complex output.
    //
    // Helpers are also by default mutators for context data that matches the
    // helper name. For example:
    //
    //    "?title" (value) {
    //      return `This is the title: ${value}`
    //    }
    //
    // Used in the template like so:
    //
    //    {{?title}}
    //
    // Rendered with a context:
    //
    //    {"title": "Important!"}
    //
    // Would automatically pull the 'title' property from the context and
    // pass it to the helper, resulting in:
    //
    //    This is the title: Important!
    //
    const self = this
    let prototype = Object.getPrototypeOf(this)
    let methods = Object.getOwnPropertyNames(prototype)
      .filter(n => n.indexOf('?') === 0)
      .map(n => {
        self.hbs.registerHelper(n, function (...args) {
          let localContext = this
          let opts = _.last(args)
          let methodArgs = _.slice(args, 0, -1)
          let method = self[n].bind(self)
          let rawProp = n.replace(/^\?/, "")
          // if the template didn't pass in the expected arg count for the method
          // we check for two separate cases:
          // - if there's a property matching the method's name in the local
          //   context (ie the context this call was made in)
          // - or, if there's a property matching the method's name in the root
          //   data context
          //
          // In these cases, we assume the method is intended to be a mutator for
          // the contextual data, so we prepend the arguments with the context data
          if (methodArgs.length < method.length) {
            if (_.has(localContext, rawProp)) {
              methodArgs.unshift(localContext[rawProp])
            }
            else if (_.has(opts.data.root, rawProp)) {
              methodArgs.unshift(opts.data.root[rawProp])
            }
          }
          // toss in the context. useful if a helper method is intended
          // to be a mutator for whatever the local context is (ie handle
          // content in loops). makes for terser syntax
          methodArgs.push(localContext)
          const result = method(...methodArgs)
          return mergelines(result)
        })
      })

    // Add color and symbol shortcut helpers under `$c:...`
    // and `$s:...` groupings.
    generateWrapHelpers(this.hbs, 'c', keysDeep(colors))
    generateWrapHelpers(this.hbs, 's', keysDeep(symbols))


    this.hbs.registerHelper('json', function() {
      return util.inspect(this, {
        colors: true,
        depth: null,
      })
    })
  }

  formatValue(value, fmt, list_fmt, list_sep) {
    let t = this.findFormatType(value)
    switch (t) {
      case "bool":
        return value ? symbols.yes : symbols.no
        break;
      case "array":
        return this.formatArray(value, list_fmt, list_sep)
        break;
      case "object":
      case "plainobject":
        return JSON.stringify(value)
        break;
      default:
        return fmt(value)
    }
  }


  findFormatType(value) {
    const checks = [
      {type: "array", fn: _.isArray},
      {type: "bool", fn: _.isBoolean},
      {type: "plainobject", fn: _.isPlainObject},
      {type: "object", fn: _.isObject},
      // types that aren't anything ^ are lumped into
      // "string" because they can be printed with no
      // extra formatting.
      {type: "string", fn: _.constant(true)}
    ]
    return _.reduce(checks, (t, c) => t || (c.fn(value) ? c.type : false), false)
  }

  formatArray (arr, itemStyle, separator = null) {
    if (!separator) separator = symbols.listSeparator
    return arr.map(item => itemStyle(item)).join(separator)
  }

  render(ctx = {}) {
    const p = path.resolve(path.join(__dirname, `../../templates/${this.templateName}.hbs`))
    let content = fs.readFileSync(p, 'utf-8')
    let tmpl = this.hbs.compile(content)
    console.log(tmpl(ctx))
  }
}

module.exports = BaseView
