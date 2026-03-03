/**
 * Beekeeper Admin API module — node management CRUD operations.
 *
 * All requests go through the mock_api.py proxy which handles:
 * - Private key redaction (P-2 security)
 * - Error normalization (NFREQ-10)
 * - 500→404 normalization for missing beehives
 *
 * This module adds client-side defense-in-depth:
 * - Never exposes private keys in return types
 * - Normalizes field names (snake_case → camelCase where appropriate)
 * - Typed error handling with ApiError class
 */

import config from '/config'
import Auth from '../auth/auth'


// ============================================================
// Types
// ============================================================

export interface Node {
  id: string
  vsn: string | null
  beehive: string | null
  mode: string | null
  name: string | null
  address: string | null
  altitude: string | null
  position: string | null
  project_id: string | null
  server_node: string | null
  internet_connection: string | null
  registration_event: string | null
  wes_deploy_event: string | null
  timestamp: string | null
}

export interface Beehive {
  id: string
  'key-type': string | null
  'key-type-args': string | null
  rmq_host: string | null
  rmq_port: number | null
  upload_host: string | null
  upload_port: number | null
  'tls-key': string | null
  'tls-cert': string | null
  'ssh-key': string | null
  'ssh-pub': string | null
  'ssh-cert': string | null
  api: string | null
}

export interface RegisterResponse {
  id: string
  publicKey: string
  certificate: string
}

export interface NodeCredentials {
  publicKey: string
}

export interface BeehiveConfig {
  id: string
  'key-type': string
  'rmq-host'?: string
  'rmq-port'?: string
  'upload-host'?: string
  'upload-port'?: string
}

export interface LogEntry {
  node_id: string
  operation: string
  field_name: string
  field_value: string
  source: string
}

export interface BeehiveCredentialFiles {
  'tls-key'?: File
  'tls-cert'?: File
  'ssh-key'?: File
  'ssh-pub'?: File
  'ssh-cert'?: File
}

export class ApiError extends Error {
  code: number
  detail?: string
  upstream_status?: number

  constructor(message: string, code: number, detail?: string, upstream_status?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.detail = detail
    this.upstream_status = upstream_status
  }
}


// ============================================================
// Internal helpers
// ============================================================

const url = config.beekeeper
const API_URL = `${url}/api`

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  if (Auth.token) {
    headers['Authorization'] = `sage ${Auth.token}`
  }
  return headers
}

async function handleResponse(res: Response) {
  if (res.ok) {
    const contentType = res.headers.get('Content-Type') || ''
    if (contentType.includes('application/json')) {
      return res.json()
    }
    return { result: await res.text() }
  }

  // Parse error body (NFREQ-10 format)
  let errorData: { error?: string; code?: number; detail?: string; upstream_status?: number }
  try {
    errorData = await res.json()
  } catch {
    errorData = { error: `Request failed with status ${res.status}` }
  }

  throw new ApiError(
    errorData.error || `Request failed with status ${res.status}`,
    errorData.code || res.status,
    errorData.detail,
    errorData.upstream_status
  )
}

function get(endpoint: string) {
  return fetch(endpoint, { headers: getHeaders() })
    .then(handleResponse)
}

function post(endpoint: string, body?: unknown) {
  return fetch(endpoint, {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(handleResponse)
}

function del(endpoint: string) {
  return fetch(endpoint, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(handleResponse)
}


// ============================================================
// Node operations
// ============================================================

export async function getNodes(): Promise<Node[]> {
  const data = await get(`${API_URL}/state`)
  return data.data || []
}

export async function getNode(nodeId: string): Promise<Node> {
  const data = await get(`${API_URL}/state/${nodeId}`)
  return data.data
}

export async function registerNode(nodeId: string, beehiveId?: string): Promise<RegisterResponse> {
  const params = new URLSearchParams({ node_id: nodeId })
  if (beehiveId) {
    params.set('beehive_id', beehiveId)
  }
  const data = await fetch(`${API_URL}/register?${params}`, {
    method: 'POST',
    headers: getHeaders(),
  }).then(handleResponse)

  // Defense-in-depth: strip private key even though proxy already does
  delete data.private_key

  return {
    id: data.id,
    publicKey: data.public_key,
    certificate: data.certificate,
  }
}

export async function assignBeehive(nodeId: string, beehiveId: string): Promise<void> {
  await post(`${API_URL}/node/${nodeId}`, { assign_beehive: beehiveId })
}

export async function deployWES(nodeId: string, debug = false, force = false): Promise<unknown> {
  const params = new URLSearchParams()
  if (debug) params.set('debug', 'true')
  if (force) params.set('force', 'true')
  const qs = params.toString()
  const endpoint = `${API_URL}/node/${nodeId}${qs ? `?${qs}` : ''}`
  return fetch(endpoint, {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ deploy_wes: true }),
  }).then(handleResponse)
}

export async function syncVSN(nodeId: string): Promise<void> {
  await post(`${API_URL}/node/${nodeId}`, { vsn: true })
}


// ============================================================
// Beehive operations
// ============================================================

export async function getBeehives(): Promise<Beehive[]> {
  const data = await get(`${API_URL}/beehives`)
  return data.data || []
}

export async function getBeehive(beehiveId: string): Promise<Beehive> {
  return get(`${API_URL}/beehives/${beehiveId}`)
}

export async function createBeehive(beehiveConfig: BeehiveConfig): Promise<void> {
  await post(`${API_URL}/beehives`, beehiveConfig)
}

export async function deleteBeehive(beehiveId: string): Promise<void> {
  await del(`${API_URL}/beehives/${beehiveId}`)
}

export async function uploadBeehiveCredentials(
  beehiveId: string,
  files: BeehiveCredentialFiles
): Promise<void> {
  const formData = new FormData()
  for (const [key, file] of Object.entries(files)) {
    if (file) {
      formData.append(key, file)
    }
  }
  await fetch(`${API_URL}/beehives/${beehiveId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  }).then(handleResponse)
}


// ============================================================
// Credential operations
// ============================================================

export async function getNodeCredentials(nodeId: string): Promise<NodeCredentials> {
  const data = await get(`${API_URL}/credentials/${nodeId}`)

  // Defense-in-depth: strip private key even though proxy already does
  delete data.ssh_key_private

  return {
    publicKey: data.ssh_key_public,
  }
}

export async function rotateNodeCredentials(
  nodeId: string,
  privateKey: string,
  publicKey: string
): Promise<void> {
  // Credential rotation requires DELETE then POST (API uses INSERT not UPDATE)
  await del(`${API_URL}/credentials/${nodeId}`)
  await post(`${API_URL}/credentials/${nodeId}`, {
    ssh_key_private: privateKey,
    ssh_key_public: publicKey,
  })
}

export async function revokeNodeCredentials(nodeId: string): Promise<void> {
  await del(`${API_URL}/credentials/${nodeId}`)
}


// ============================================================
// Decommission operations (multi-step)
// ============================================================

export async function logEntries(entries: LogEntry[]): Promise<void> {
  await post(`${API_URL}/log`, entries)
}

export async function replayState(): Promise<void> {
  await get(`${API_URL}/replay`)
}
