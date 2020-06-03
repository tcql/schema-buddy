const BaseView = require('./BaseView')
const {
  colors,
  symbols,
} = require('../styling')

// const Handlebars = require('handlebars')

class SummarizeView extends BaseView {


  "?title" () {
    return [
      'Schema Summary',
      '--------------',
    ].map(colors.title)
  }


  "?sectionTitle" (title) {
    return  colors.highlight(`[ ${title} ]`)
  }


  "?metadata" ({key, value}) {
    let keyFmt = colors.summary.metadata.key(key)
    let valueFmt = this.formatValue(
      value,
      colors.summary.metadata.value,
      colors.summary.metadata.value().italic,
      symbols.listSeparator
    )
    return `${keyFmt}: ${valueFmt}`
  }


  "?field" ({key, type, required}) {
    let requiredCol = required ? symbols.yes : " "
    let fieldCol = colors.summary.fields.key(key)
    let typeCol = this.formatValue(
      type,
      colors.summary.fields.type,
      colors.summary.fields.type,
      symbols.listSeparator
    )
    return `${requiredCol} ${fieldCol} ${typeCol}`
  }

}

module.exports = SummarizeView
