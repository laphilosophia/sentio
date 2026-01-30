// generate-i18n-large.ts
import fs from 'fs'

const DOMAINS = [
  'common',
  'errors',
  'auth',
  'user',
  'billing',
  'runtime',
  'language',
  'storage',
  'scheduler',
]

const DEPTH = 5
const WIDTH = 6
const LEAF_ENTRIES = 8

function leafEntries(prefix: string) {
  const out: Record<string, string> = {}
  for (let i = 0; i < LEAF_ENTRIES; i++) {
    out[`${prefix}_text_${i}`] = `Sample text ${i} for {{context}} in ${prefix}.`
  }
  return out
}

function buildNode(depth: number, prefix: string): Record<string, unknown> {
  if (depth === 0) {
    return leafEntries(prefix)
  }

  const node: Record<string, unknown> = {}
  for (let i = 0; i < WIDTH; i++) {
    node[`${prefix}_lvl${depth}_${i}`] = buildNode(depth - 1, `${prefix}_${i}`)
  }
  return node
}

const root: Record<string, unknown> = {
  meta: {
    language: 'en',
    type: 'plain-i18n',
    generatedAt: new Date().toISOString(),
  },
}

for (const domain of DOMAINS) {
  root[domain] = buildNode(DEPTH, domain)
}

fs.writeFileSync('i18n.large.json', JSON.stringify(root, null, 2), 'utf8')
