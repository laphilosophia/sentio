// generate-icu-i18n.ts
import fs from 'fs'

const DOMAINS = ['auth', 'billing', 'runtime', 'language', 'storage', 'scheduler']
const VARIANTS = ['basic', 'plural', 'select', 'nested', 'ordinal', 'stress']
const DEPTH = 6
const ENTRIES_PER_NODE = 6

function icuMessage(type: string, i: number) {
  switch (type) {
    case 'basic':
      return 'Hello {user}.'
    case 'plural':
      return '{count, plural, =0 {No items} one {# item} other {# items}}'
    case 'select':
      return '{state, select, on {Enabled} off {Disabled} other {Unknown}}'
    case 'ordinal':
      return '{pos, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}'
    case 'nested':
      return '{count, plural, one {{gender, select, male {He} female {She} other {They}} logged in} other {{gender, select, male {He} female {She} other {They}} logged in # times}}'
    case 'stress':
      return '{a, select, x {{b, plural, one {{c, select, on {Enabled} off {Disabled} other {Unknown}}} other {Multiple}}} other {N/A}}'
    default:
      return `Message ${i}`
  }
}

function buildNode(depth: number, prefix: string): Record<string, unknown> {
  if (depth === 0) {
    const leaf: Record<string, unknown> = {}
    for (let i = 0; i < ENTRIES_PER_NODE; i++) {
      const variant = VARIANTS[i % VARIANTS.length]
      leaf[`${variant}_${i}`] = icuMessage(variant, i)
    }
    return leaf
  }

  const node: Record<string, unknown> = {}
  for (let i = 0; i < ENTRIES_PER_NODE; i++) {
    node[`${prefix}_lvl${depth}_${i}`] = buildNode(depth - 1, prefix)
  }
  return node
}

const root: Record<string, unknown> = {
  meta: {
    language: 'en',
    format: 'icu-message',
    generatedAt: new Date().toISOString(),
  },
}

for (const domain of DOMAINS) {
  root[domain] = buildNode(DEPTH, domain)
}

fs.writeFileSync('icu-i18n.large.json', JSON.stringify(root, null, 2), 'utf8')
