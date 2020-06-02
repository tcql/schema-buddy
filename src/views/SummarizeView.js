const BaseView = require('./BaseView')
const {
  colors,
  symbols,
} = require('../styling')

class SummarizeView extends BaseView {
  title() {
    return [
      'Schema Summary',
      '--------------',
    ].map(colors.title)
  }


  sectionTitle(title) {
    return  colors.highlight(`[ ${title} ]`)
  }


  metadata({key, value}) {
    let keyFmt = colors.summary.metadata.key(key)
    let valueFmt = this.formatValue(
      value,
      colors.summary.metadata.value,
      colors.summary.metadata.value().italic,
      symbols.listSeparator
    )
    return `${keyFmt}: ${valueFmt}`
  }


  metadataSection(name, elements) {
    let title = this.sectionTitle([name, "metadata"].join(" "))
    let renderedElements = elements.map(e => this.metadata(e))

    return [
      title,
      renderedElements,
    ]
  }


  field({key, type, required}) {
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


  fieldsSection(elements) {
    let title = this.sectionTitle("fields")
    let renderedElements = elements.map(e => this.field(e))

    return [
      title,
      renderedElements,
    ]
  }


  generate({schema, summary}) {
    return [
      this.title(),
      this.metadataSection("core", summary.core),
      "",
      this.metadataSection("user", summary.user),
      "",
      this.fieldsSection(summary.fields),
    ]
  }
}

module.exports = SummarizeView
