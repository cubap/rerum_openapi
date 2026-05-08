import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import yaml from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

const schemaPath = path.join(repoRoot, 'schemas', 'seam-manifest.schema.json')
const seamsPath = path.join(repoRoot, 'seams')

function collectManifestPaths(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectManifestPaths(fullPath))
      continue
    }

    if (entry.isFile() && entry.name === 'manifest.yaml') {
      files.push(fullPath)
    }
  }

  return files
}

function relativeToRoot(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/')
}

function main() {
  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema not found: ${relativeToRoot(schemaPath)}`)
    process.exit(1)
  }

  if (!fs.existsSync(seamsPath)) {
    console.error('Seams folder not found.')
    process.exit(1)
  }

  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))
  const manifestPaths = collectManifestPaths(seamsPath)

  if (manifestPaths.length === 0) {
    console.error('No manifest.yaml files found under seams/.')
    process.exit(1)
  }

  const ajv = new Ajv2020({ allErrors: true })
  const validate = ajv.compile(schema)

  let hasError = false

  for (const manifestPath of manifestPaths) {
    const relativePath = relativeToRoot(manifestPath)
    const content = fs.readFileSync(manifestPath, 'utf8')
    let data

    try {
      data = yaml.load(content)
    } catch (error) {
      hasError = true
      console.error(`\n[FAIL] ${relativePath}`)
      console.error(`  YAML parse error: ${error.message}`)
      continue
    }

    const isValid = validate(data)
    if (isValid) {
      console.log(`[PASS] ${relativePath}`)
      continue
    }

    hasError = true
    console.error(`\n[FAIL] ${relativePath}`)
    for (const issue of validate.errors ?? []) {
      const location = issue.instancePath || '/'
      console.error(`  ${location}: ${issue.message}`)
    }
  }

  if (hasError) {
    process.exit(1)
  }

  console.log(`\nValidated ${manifestPaths.length} manifest file(s).`)
}

main()
