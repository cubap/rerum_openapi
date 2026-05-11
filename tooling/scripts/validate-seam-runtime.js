import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import yaml from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')
const httpMethods = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace']

function parseArgs(argv) {
  const args = {
    comparePaths: true,
    compareOperations: true,
    timeoutMs: 10000,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === '--manifest') {
      args.manifest = argv[index + 1]
      index += 1
      continue
    }

    if (argument === '--base-url') {
      args.baseUrl = argv[index + 1]
      index += 1
      continue
    }

    if (argument === '--compare-paths') {
      args.comparePaths = argv[index + 1] !== 'false'
      index += 1
      continue
    }

    if (argument === '--compare-operations') {
      args.compareOperations = argv[index + 1] !== 'false'
      index += 1
      continue
    }

    if (argument === '--fixture-file') {
      args.fixtureFile = argv[index + 1]
      index += 1
      continue
    }

    if (argument === '--timeout-ms') {
      args.timeoutMs = Number.parseInt(argv[index + 1], 10)
      index += 1
      continue
    }

    if (argument === '--help') {
      args.help = true
    }
  }

  return args
}

function printUsage() {
  console.log('Usage: node tooling/scripts/validate-seam-runtime.js --manifest <path> [--base-url <url>] [--fixture-file <path>] [--compare-paths true|false] [--compare-operations true|false] [--timeout-ms <ms>]')
}

function loadYamlFile(filePath) {
  return yaml.load(fs.readFileSync(filePath, 'utf8'))
}

function loadStructuredFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')

  if (filePath.endsWith('.json')) {
    return JSON.parse(content)
  }

  return yaml.load(content)
}

function ensureLeadingSlash(value) {
  if (!value) {
    return value
  }

  return value.startsWith('/') ? value : `/${value}`
}

function buildUrl(baseUrl, endpointPath) {
  return new URL(ensureLeadingSlash(endpointPath), baseUrl).toString()
}

async function fetchJsonish(url, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      headers: {
        accept: 'application/json, application/yaml, text/yaml, text/plain;q=0.9, */*;q=0.8',
      },
      signal: controller.signal,
    })

    const body = await response.text()

    return {
      body,
      ok: response.ok,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    }
  } finally {
    clearTimeout(timeout)
  }
}

function parseSpecDocument(rawBody) {
  try {
    return JSON.parse(rawBody)
  } catch {
    return yaml.load(rawBody)
  }
}

function getExpectedPathSet(openapiDocument) {
  return new Set(Object.keys(openapiDocument?.paths ?? {}))
}

function getOperationEntries(pathItem = {}) {
  return Object.entries(pathItem).filter(([method]) => httpMethods.includes(method))
}

function getResponseCodeSet(operation = {}) {
  return new Set(Object.keys(operation?.responses ?? {}))
}

function validateSpecSubset(localOpenapi, remoteOpenapi) {
  const localPaths = getExpectedPathSet(localOpenapi)
  const remotePaths = getExpectedPathSet(remoteOpenapi)
  const missingPaths = [...localPaths].filter((pathKey) => !remotePaths.has(pathKey))

  return {
    localPathCount: localPaths.size,
    missingPaths,
  }
}

function validateOperationSubset(localOpenapi, remoteOpenapi) {
  const localPaths = localOpenapi?.paths ?? {}
  const remotePaths = remoteOpenapi?.paths ?? {}
  const missingOperations = []
  const missingResponseStatuses = []
  let checkedOperationCount = 0

  for (const [pathKey, localPathItem] of Object.entries(localPaths)) {
    const remotePathItem = remotePaths[pathKey]
    if (!remotePathItem) {
      continue
    }

    for (const [method, localOperation] of getOperationEntries(localPathItem)) {
      checkedOperationCount += 1
      const remoteOperation = remotePathItem[method]

      if (!remoteOperation) {
        missingOperations.push(`${method.toUpperCase()} ${pathKey}`)
        continue
      }

      const localResponseCodes = getResponseCodeSet(localOperation)
      const remoteResponseCodes = getResponseCodeSet(remoteOperation)

      for (const responseCode of localResponseCodes) {
        if (remoteResponseCodes.has(responseCode)) {
          continue
        }

        if (responseCode !== 'default' && remoteResponseCodes.has('default')) {
          continue
        }

        missingResponseStatuses.push(`${method.toUpperCase()} ${pathKey} -> ${responseCode}`)
      }
    }
  }

  return {
    checkedOperationCount,
    missingOperations,
    missingResponseStatuses,
  }
}

function normalizeMethod(method) {
  return String(method ?? '').trim().toLowerCase()
}

function normalizeStatus(status) {
  if (status === undefined || status === null || status === '') {
    return undefined
  }

  return String(status)
}

function getFixtureInteractions(fixtureDocument) {
  if (Array.isArray(fixtureDocument)) {
    return fixtureDocument
  }

  if (Array.isArray(fixtureDocument?.interactions)) {
    return fixtureDocument.interactions
  }

  throw new Error('Fixture file must be an array or an object with an interactions array.')
}

function decodeJsonPointerSegment(segment) {
  return segment.replaceAll('~1', '/').replaceAll('~0', '~')
}

function getByPointer(document, pointer = '') {
  if (!pointer || pointer === '#') {
    return document
  }

  const normalized = pointer.startsWith('#') ? pointer.slice(1) : pointer
  if (!normalized) {
    return document
  }

  return normalized.split('/').slice(1).reduce((current, segment) => {
    if (current === undefined || current === null) {
      return undefined
    }

    return current[decodeJsonPointerSegment(segment)]
  }, document)
}

function cloneValue(value) {
  if (value === undefined) {
    return undefined
  }

  return JSON.parse(JSON.stringify(value))
}

function createDocumentLoader() {
  const cache = new Map()

  function loadDocument(filePath) {
    const absolutePath = path.resolve(filePath)
    if (cache.has(absolutePath)) {
      return cache.get(absolutePath)
    }

    const document = loadStructuredFile(absolutePath)
    cache.set(absolutePath, document)
    return document
  }

  return { loadDocument }
}

function resolveRef(ref, baseFilePath, loader) {
  const [refPath, pointer = ''] = ref.split('#')
  const targetFilePath = refPath ? path.resolve(path.dirname(baseFilePath), refPath) : baseFilePath
  const targetDocument = loader.loadDocument(targetFilePath)
  const targetValue = getByPointer(targetDocument, pointer ? `#${pointer}` : '#')

  return {
    targetFilePath,
    targetValue,
  }
}

function dereferenceSchema(schema, baseFilePath, loader, seenRefs = new Set()) {
  if (Array.isArray(schema)) {
    return schema.map((entry) => dereferenceSchema(entry, baseFilePath, loader, seenRefs))
  }

  if (!schema || typeof schema !== 'object') {
    return schema
  }

  if (schema.$ref) {
    const refKey = `${baseFilePath}::${schema.$ref}`
    if (seenRefs.has(refKey)) {
      throw new Error(`Circular schema reference detected: ${schema.$ref}`)
    }

    const nextSeenRefs = new Set(seenRefs)
    nextSeenRefs.add(refKey)
    const { targetFilePath, targetValue } = resolveRef(schema.$ref, baseFilePath, loader)
    return dereferenceSchema(targetValue, targetFilePath, loader, nextSeenRefs)
  }

  const result = {}
  for (const [key, value] of Object.entries(schema)) {
    result[key] = dereferenceSchema(value, baseFilePath, loader, seenRefs)
  }

  return result
}

function pickJsonContentSchema(content = {}) {
  const jsonLikeEntry = Object.entries(content).find(([contentType]) => {
    return contentType.includes('json') || contentType === '*/*'
  })

  if (jsonLikeEntry) {
    return jsonLikeEntry[1]?.schema
  }

  const firstEntry = Object.values(content)[0]
  return firstEntry?.schema
}

function getRequestSchema(operation, baseFilePath, loader) {
  const requestBody = operation?.requestBody
  if (!requestBody?.content) {
    return null
  }

  const schema = pickJsonContentSchema(requestBody.content)
  if (!schema) {
    return null
  }

  return dereferenceSchema(schema, baseFilePath, loader)
}

function getResponseSchema(operation, expectedStatus, baseFilePath, loader) {
  const responses = operation?.responses ?? {}
  const response = responses[expectedStatus] ?? responses.default
  if (!response?.content) {
    return null
  }

  const schema = pickJsonContentSchema(response.content)
  if (!schema) {
    return null
  }

  return dereferenceSchema(schema, baseFilePath, loader)
}

function createSchemaValidator() {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: false,
  })

  return function validateSchema(schema, value, label) {
    const compiled = ajv.compile(cloneValue(schema))
    const valid = compiled(value)

    if (valid) {
      return []
    }

    return (compiled.errors ?? []).map((error) => {
      const location = error.instancePath || '/'
      return `${label} ${location}: ${error.message}`
    })
  }
}

function validateFixturesAgainstBaseline(openapiContext, fixtureDocument) {
  const interactions = getFixtureInteractions(fixtureDocument)
  const paths = openapiContext.document?.paths ?? {}
  const issues = []
  const validateSchema = createSchemaValidator()

  for (const [index, interaction] of interactions.entries()) {
    const pathKey = interaction?.path
    const method = normalizeMethod(interaction?.method)
    const expectedStatus = normalizeStatus(
      interaction?.expectedStatus ?? interaction?.status ?? interaction?.response?.status,
    )

    if (!pathKey || !method) {
      issues.push(`interaction[${index}] is missing required path or method`)
      continue
    }

    const pathItem = paths[pathKey]
    if (!pathItem) {
      issues.push(`interaction[${index}] references undocumented path: ${pathKey}`)
      continue
    }

    const operation = pathItem[method]
    if (!operation) {
      issues.push(`interaction[${index}] references undocumented operation: ${method.toUpperCase()} ${pathKey}`)
      continue
    }

    const requestBody = interaction?.request ?? interaction?.requestBody
    if (requestBody !== undefined) {
      const requestSchema = getRequestSchema(operation, openapiContext.filePath, openapiContext.loader)
      if (!requestSchema) {
        issues.push(`interaction[${index}] includes a request payload but ${method.toUpperCase()} ${pathKey} has no requestBody schema in the baseline`)
      } else {
        issues.push(...validateSchema(requestSchema, requestBody, `interaction[${index}] request for ${method.toUpperCase()} ${pathKey}`))
      }
    }

    if (!expectedStatus) {
      continue
    }

    const responses = operation.responses ?? {}
    if (!responses[expectedStatus] && !responses.default) {
      issues.push(`interaction[${index}] uses undocumented response status ${expectedStatus} for ${method.toUpperCase()} ${pathKey}`)
      continue
    }

    const responseBody = interaction?.response?.body ?? interaction?.responseBody
    if (responseBody === undefined) {
      continue
    }

    const responseSchema = getResponseSchema(operation, expectedStatus, openapiContext.filePath, openapiContext.loader)
    if (!responseSchema) {
      continue
    }

    issues.push(...validateSchema(responseSchema, responseBody, `interaction[${index}] response for ${method.toUpperCase()} ${pathKey}`))
  }

  return {
    interactionCount: interactions.length,
    issues,
  }
}

function loadLocalOpenapi(manifest) {
  const openapiSourceLocation = manifest?.openapi_source?.location
  if (!openapiSourceLocation) {
    return null
  }

  const openapiFilePath = path.resolve(repoRoot, openapiSourceLocation)
  if (!fs.existsSync(openapiFilePath)) {
    return null
  }

  const loader = createDocumentLoader()
  return {
    document: loader.loadDocument(openapiFilePath),
    filePath: openapiFilePath,
    loader,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printUsage()
    process.exit(0)
  }

  if (!args.manifest || (!args.baseUrl && !args.fixtureFile)) {
    printUsage()
    process.exit(1)
  }

  const manifestPath = path.resolve(process.cwd(), args.manifest)
  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`)
    process.exit(1)
  }

  const manifest = loadYamlFile(manifestPath)
  const localOpenapi = loadLocalOpenapi(manifest)

  if (args.fixtureFile && !localOpenapi) {
    console.error('Fixture validation requires a local OpenAPI artifact referenced by openapi_source.location.')
    process.exit(1)
  }

  if (args.fixtureFile) {
    const fixturePath = path.resolve(process.cwd(), args.fixtureFile)
    if (!fs.existsSync(fixturePath)) {
      console.error(`Fixture file not found: ${fixturePath}`)
      process.exit(1)
    }

    const fixtureDocument = loadStructuredFile(fixturePath)
    const fixtureValidation = validateFixturesAgainstBaseline(localOpenapi, fixtureDocument)
    if (fixtureValidation.issues.length > 0) {
      console.error(`Fixture validation failed with ${fixtureValidation.issues.length} issue(s):`)
      for (const issue of fixtureValidation.issues) {
        console.error(`- ${issue}`)
      }
      process.exit(1)
    }

    console.log(`Validated ${fixtureValidation.interactionCount} fixture interaction(s) against the local baseline.`)
  }

  if (!args.baseUrl) {
    process.exit(0)
  }

  const testEndpoints = manifest?.test_endpoint_contract
  const hasTestEndpointContract = Boolean(testEndpoints)
  if (!testEndpoints) {
    console.log('Manifest does not define test_endpoint_contract. Runtime endpoint probes skipped.')
  }

  if (testEndpoints?.health_endpoint) {
    const healthUrl = buildUrl(args.baseUrl, testEndpoints.health_endpoint)
    const healthResult = await fetchJsonish(healthUrl, args.timeoutMs)
    if (!healthResult.ok) {
      console.error(`Health endpoint failed: ${healthUrl} (${healthResult.status})`)
      process.exit(1)
    }
    console.log(`Health endpoint passed: ${healthUrl}`)
  } else if (hasTestEndpointContract) {
    console.log('Health endpoint probe skipped: test_endpoint_contract.health_endpoint is not defined.')
  }

  if (testEndpoints?.readiness_endpoint) {
    const readinessUrl = buildUrl(args.baseUrl, testEndpoints.readiness_endpoint)
    const readinessResult = await fetchJsonish(readinessUrl, args.timeoutMs)
    if (!readinessResult.ok) {
      console.error(`Readiness endpoint failed: ${readinessUrl} (${readinessResult.status})`)
      process.exit(1)
    }
    console.log(`Readiness endpoint passed: ${readinessUrl}`)
  } else if (hasTestEndpointContract) {
    console.log('Readiness endpoint probe skipped: test_endpoint_contract.readiness_endpoint is not defined.')
  }

  let specResult = null
  if (testEndpoints?.spec_endpoint) {
    const specUrl = buildUrl(args.baseUrl, testEndpoints.spec_endpoint)
    specResult = await fetchJsonish(specUrl, args.timeoutMs)
    if (!specResult.ok) {
      console.error(`Spec endpoint failed: ${specUrl} (${specResult.status})`)
      process.exit(1)
    }
    console.log(`Spec endpoint passed: ${specUrl}`)
  } else if (hasTestEndpointContract) {
    console.log('Spec endpoint probe skipped: test_endpoint_contract.spec_endpoint is not defined.')
  }

  if (!localOpenapi) {
    console.log('Manifest does not define openapi_source.location. Baseline comparisons skipped.')
    process.exit(0)
  }

  if (!specResult) {
    console.log('Spec endpoint data is unavailable because test_endpoint_contract.spec_endpoint is not configured. Baseline comparisons skipped.')
    process.exit(0)
  }

  const remoteOpenapi = parseSpecDocument(specResult.body)

  if (args.comparePaths) {
    const comparison = validateSpecSubset(localOpenapi.document, remoteOpenapi)

    if (comparison.missingPaths.length > 0) {
      console.error(`Remote spec is missing ${comparison.missingPaths.length} expected path(s):`)
      for (const missingPath of comparison.missingPaths) {
        console.error(`- ${missingPath}`)
      }
      process.exit(1)
    }

    console.log(`Remote spec contains all ${comparison.localPathCount} expected path(s) from the local baseline.`)
  } else {
    console.log('Path comparison skipped by configuration.')
  }

  if (!args.compareOperations) {
    console.log('Operation comparison skipped by configuration.')
    process.exit(0)
  }

  const operationComparison = validateOperationSubset(localOpenapi.document, remoteOpenapi)
  if (operationComparison.missingOperations.length > 0) {
    console.error(`Remote spec is missing ${operationComparison.missingOperations.length} expected operation(s):`)
    for (const missingOperation of operationComparison.missingOperations) {
      console.error(`- ${missingOperation}`)
    }
    process.exit(1)
  }

  if (operationComparison.missingResponseStatuses.length > 0) {
    console.error(`Remote spec is missing ${operationComparison.missingResponseStatuses.length} expected response mapping(s):`)
    for (const missingResponseStatus of operationComparison.missingResponseStatuses) {
      console.error(`- ${missingResponseStatus}`)
    }
    process.exit(1)
  }

  console.log(`Remote spec contains all ${operationComparison.checkedOperationCount} expected operation(s) and documented response statuses.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
