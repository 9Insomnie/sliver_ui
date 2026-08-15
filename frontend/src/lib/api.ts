import type {
  Session,
  Beacon,
  Event,
  ImplantBuild,
  ImplantConfig,
  GenerateResult,
  Job,
  DirView,
  NetInterface,
  ProcessInfo,
  SockEntry,
  EnvVar,
  ExecResult,
  PortForward,
  BeaconTask,
  SocksProxy,
  ImplantProfile,
  ServerInfo,
  OverviewData,
  LootEntry,
  CompilerInfo,
  Host,
  Website,
  WGClientConfig,
  WGTCPForwarder,
  WGSocksServer,
  WindowsPrivilege,
  PivotListener,
  PivotGraphEntry,
  SSHCommandResult,
  CallExtensionResult,
  MsfStager,
  Canary,
} from './types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
  return body as T
}

export const api = {
  info: () => request<ServerInfo>('/info'),

  overview: () => request<OverviewData>('/overview'),

  connect: (config: { name: string; lhost: string; lport: number }) =>
    request<{ success: boolean; error?: string }>('/connect', { method: 'POST', body: JSON.stringify(config) }),

  disconnect: () => request<{ success: boolean }>('/disconnect', { method: 'POST' }),

  listProfiles: () => request<{ profiles: string[] }>('/profiles'),

  useProfile: (name: string) => request<{ success: boolean; error?: string }>(`/profiles/${name}`, { method: 'POST' }),

  sessions: () => request<{ sessions: Session[] }>('/sessions'),

  beacons: () => request<{ beacons: Beacon[] }>('/beacons'),

  beacon: (id: string) => request<Beacon>(`/beacons/${encodeURIComponent(id)}`),

  openSessionFromBeacon: (beaconId: string) =>
    request<{ success: boolean; async?: boolean }>(`/beacons/${encodeURIComponent(beaconId)}/open-session`, {
      method: 'POST',
    }),

  closeSession: (sessionId: string) =>
    request<{ success: boolean }>(`/sessions/${encodeURIComponent(sessionId)}/close`, { method: 'POST' }),

  monitorStart: () => request<{ success: boolean }>('/monitor/start', { method: 'POST' }),

  monitorStop: () => request<{ success: boolean }>('/monitor/stop', { method: 'POST' }),

  jobs: () => request<{ jobs: Job[] }>('/jobs'),

  events: () => request<{ events: Event[] }>('/events'),

  builders: () => request<{ builders: ImplantBuild[] }>('/builders'),

  generate: (config: Partial<ImplantConfig>) =>
    request<GenerateResult>(`/generate`, { method: 'POST', body: JSON.stringify(config) }),

  startListener: (job: { type: string; addr: string; port: number; tls: boolean }) =>
    request<{ success: boolean; error?: string }>('/listeners', { method: 'POST', body: JSON.stringify(job) }),

  stopListener: (jobId: number) =>
    request<{ success: boolean; error?: string }>(`/listeners/${jobId}`, { method: 'DELETE' }),

  killSession: (sessionId: string) =>
    request<{ success: boolean; error?: string }>(`/sessions/${sessionId}/kill`, { method: 'POST' }),

  renameSession: (sessionId: string, name: string) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/rename`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  renameBeacon: (beaconId: string, name: string) =>
    request<{ success: boolean }>(`/beacons/${beaconId}/rename`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  rmBeacon: (beaconId: string) =>
    request<{ success: boolean }>(`/beacons/${beaconId}`, { method: 'DELETE' }),

  beaconTasks: (beaconId: string) => request<{ tasks: BeaconTask[] }>(`/beacons/${beaconId}/tasks`),

  beaconTaskContent: (beaconId: string, taskId: string) =>
    request<BeaconTask>(`/beacons/${beaconId}/tasks/${taskId}`),

  lootList: (type?: string) => {
    const q = type ? `?type=${encodeURIComponent(type)}` : ''
    return request<{ loot: LootEntry[] }>(`/loot${q}`)
  },

  lootContent: (id: string) => request<LootEntry>(`/loot/${encodeURIComponent(id)}`),

  lootRemove: (id: string) => request<{ success: boolean }>(`/loot/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  lootAdd: (body: {
    type: 'file' | 'credential'
    name: string
    file_name?: string
    file_type?: 'text' | 'binary'
    file_data_b64?: string
    cred_user?: string
    cred_password?: string
    cred_api_key?: string
  }) => request<{ success: boolean; id?: string }>('/loot', { method: 'POST', body: JSON.stringify(body) }),

  lootRename: (id: string, name: string) =>
    request<{ success: boolean }>(`/loot/${encodeURIComponent(id)}/rename`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  implantProfiles: () => request<{ profiles: ImplantProfile[] }>('/implant-profiles'),

  saveImplantProfile: (body: {
    name: string
    is_beacon: boolean
    config: Partial<ImplantConfig>
  }) =>
    request<{ success: boolean }>('/implant-profiles', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteImplantProfile: (name: string) =>
    request<{ success: boolean }>(`/implant-profiles/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),

  socksList: () => request<{ proxies: SocksProxy[] }>('/socks'),

  socksStart: (req: {
    session_id: string
    bind_addr?: string
    bind_port?: number
    username?: string
    password?: string
  }) =>
    request<{ success: boolean; id?: number; bindAddr?: string; bindPort?: number }>('/socks', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  socksStop: (id: number) => request<{ success: boolean }>(`/socks/${id}`, { method: 'DELETE' }),

  terminalWs: (sessionId: string) => `${BASE}/sessions/${sessionId}/terminal`,

  // --- Filesystem ---
  fsList: (sessionId: string, path?: string) => {
    const q = path ? `?path=${encodeURIComponent(path)}` : ''
    return request<DirView>(`/sessions/${sessionId}/fs${q}`)
  },
  fsPwd: (sessionId: string) => request<{ Path: string }>(`/sessions/${sessionId}/fs/pwd`),
  fsCd: (sessionId: string, path: string) =>
    request<{ Path: string }>(`/sessions/${sessionId}/fs/cd`, { method: 'POST', body: JSON.stringify({ path }) }),
  fsCat: (sessionId: string, path: string) =>
    request<{ Data: string; Name: string }>(
      `/sessions/${sessionId}/fs/cat?path=${encodeURIComponent(path)}`,
    ),
  fsDownload: (sessionId: string, path: string) =>
    request<{ Data: string; Name: string }>(
      `/sessions/${sessionId}/fs/download?path=${encodeURIComponent(path)}`,
    ),
  fsUpload: (sessionId: string, path: string, data: string) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/fs/upload`, {
      method: 'POST',
      body: JSON.stringify({ path, data }),
    }),
  fsMkdir: (sessionId: string, path: string) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/fs/mkdir`, {
      method: 'POST',
      body: JSON.stringify({ path }),
    }),
  fsRm: (sessionId: string, path: string, recursive = false) =>
    request<{ success: boolean }>(
      `/sessions/${sessionId}/fs?path=${encodeURIComponent(path)}&recursive=${recursive}`,
      { method: 'DELETE' },
    ),
  fsMv: (sessionId: string, src: string, dst: string) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/fs/mv`, {
      method: 'POST',
      body: JSON.stringify({ src, dst }),
    }),

  // --- Recon ---
  ifconfig: (sessionId: string) => request<{ interfaces: NetInterface[] }>(`/sessions/${sessionId}/ifconfig`),
  ps: (sessionId: string) => request<{ processes: ProcessInfo[] }>(`/sessions/${sessionId}/ps`),
  killProcess: (sessionId: string, pid: number, force = false) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/ps/kill`, {
      method: 'POST',
      body: JSON.stringify({ pid, force }),
    }),
  netstat: (sessionId: string) => request<{ entries: SockEntry[] }>(`/sessions/${sessionId}/netstat`),
  env: (sessionId: string) => request<{ env: EnvVar[] }>(`/sessions/${sessionId}/env`),
  setEnv: (sessionId: string, key: string, value: string) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/env`, {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    }),
  unsetEnv: (sessionId: string, key: string) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/env/${key}`, { method: 'DELETE' }),
  exec: (sessionId: string, path: string, args: string[]) =>
    request<ExecResult>(`/sessions/${sessionId}/exec`, {
      method: 'POST',
      body: JSON.stringify({ path, args }),
    }),
  screenshot: (sessionId: string) => request<{ Data: string }>(`/sessions/${sessionId}/screenshot`),

  // --- Registry ---
  regSubKeys: (sessionId: string, hive: string, path: string) =>
    request<{ keys: string[] }>(
      `/sessions/${sessionId}/reg/subkeys?hive=${encodeURIComponent(hive)}&path=${encodeURIComponent(path)}`,
    ),
  regValues: (sessionId: string, hive: string, path: string) =>
    request<{ values: string[] }>(
      `/sessions/${sessionId}/reg/values?hive=${encodeURIComponent(hive)}&path=${encodeURIComponent(path)}`,
    ),
  regRead: (sessionId: string, hive: string, path: string, key: string) =>
    request<{ Value: string }>(
      `/sessions/${sessionId}/reg/read?hive=${encodeURIComponent(hive)}&path=${encodeURIComponent(path)}&key=${encodeURIComponent(key)}`,
    ),
  regWrite: (sessionId: string, hive: string, path: string, key: string, value: string, type?: string) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/reg/write`, {
      method: 'POST',
      body: JSON.stringify({ hive, path, key, value, type: type || 'string' }),
    }),
  regDeleteKey: (sessionId: string, hive: string, path: string, key: string) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/reg/delete-key`, {
      method: 'POST',
      body: JSON.stringify({ hive, path, key }),
    }),

  reconfigureSession: (sessionId: string, reconnectInterval: number) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/reconfigure`, {
      method: 'POST',
      body: JSON.stringify({ reconnect_interval: reconnectInterval }),
    }),

  // --- Port forwarding ---
  portfwdList: () => request<{ forwards: PortForward[] }>('/portfwd'),
  portfwdStart: (req: {
    session_id: string
    bind_addr?: string
    bind_port?: number
    remote_host?: string
    remote_port: number
  }) => request<{ success: boolean; localAddr?: string; localPort?: number }>('/portfwd', {
    method: 'POST',
    body: JSON.stringify(req),
  }),
  portfwdStop: (port: number) => request<{ success: boolean }>(`/portfwd/${port}`, { method: 'DELETE' }),

  // --- Extended operations (P1) ---
  execAssembly: (sessionId: string, assembly: string, assemblyArgs: string, process: string) =>
    request<{ output: string }>(`/sessions/${sessionId}/exec-assembly`, {
      method: 'POST',
      body: JSON.stringify({ assembly, arguments: assemblyArgs, process }),
    }),

  sideload: (sessionId: string, data: string, processName: string, args: string, entryPoint: string) =>
    request<{ result: string }>(`/sessions/${sessionId}/sideload`, {
      method: 'POST',
      body: JSON.stringify({ data, processName, args, entryPoint }),
    }),

  spawnDll: (sessionId: string, data: string, processName: string, args: string, entryPoint: string) =>
    request<{ result: string }>(`/sessions/${sessionId}/spawn-dll`, {
      method: 'POST',
      body: JSON.stringify({ data, processName, args, entryPoint }),
    }),

  migrate: (sessionId: string, pid: number) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/migrate`, {
      method: 'POST',
      body: JSON.stringify({ pid }),
    }),

  processDump: (sessionId: string, pid: number) =>
    request<{ data: string }>(`/sessions/${sessionId}/process-dump`, {
      method: 'POST',
      body: JSON.stringify({ pid }),
    }),

  impersonate: (sessionId: string, username: string) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/impersonate`, {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),

  makeToken: (sessionId: string, username: string, password: string, domain: string) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/make-token`, {
      method: 'POST',
      body: JSON.stringify({ username, password, domain }),
    }),

  revToSelf: (sessionId: string) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/rev-to-self`, { method: 'POST' }),

  getSystem: (sessionId: string, hostingProcess: string) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/getsystem`, {
      method: 'POST',
      body: JSON.stringify({ hostingProcess }),
    }),

  ping: (sessionId: string) =>
    request<{ nonce: number }>(`/sessions/${sessionId}/ping`, { method: 'POST' }),

  deleteImplantBuild: (name: string) =>
    request<{ success: boolean }>(`/implant-builds/${name}`, { method: 'DELETE' }),

  regenerate: (implantName: string) =>
    request<GenerateResult>('/regenerate', {
      method: 'POST',
      body: JSON.stringify({ implantName }),
    }),

  getOperators: () => request<{ operators: { name: string; online: boolean }[] }>('/operators'),

  compiler: () => request<CompilerInfo>('/compiler'),

  hosts: () => request<{ hosts: Host[] }>('/hosts'),

  host: (uuid: string) => request<Host>(`/hosts/${encodeURIComponent(uuid)}`),

  hostRemove: (uuid: string) => request<{ success: boolean }>(`/hosts/${encodeURIComponent(uuid)}`, { method: 'DELETE' }),

  hostIOCRm: (uuid: string, iocId: string) =>
    request<{ success: boolean }>(`/hosts/${encodeURIComponent(uuid)}/iocs/${encodeURIComponent(iocId)}`, {
      method: 'DELETE',
    }),

  // --- Websites ---
  websites: () => request<{ websites: Website[] }>('/websites'),

  website: (name: string) => request<Website>(`/websites/${encodeURIComponent(name)}`),

  websiteAddContent: (name: string, body: { path: string; content_type?: string; file_data_b64?: string; text?: string }) =>
    request<Website>(`/websites/${encodeURIComponent(name)}/content`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  websiteUpdateContent: (name: string, body: { path: string; content_type?: string; file_data_b64?: string; text?: string }) =>
    request<Website>(`/websites/${encodeURIComponent(name)}/content`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  websiteRemoveContent: (name: string, paths: string[]) =>
    request<Website>(`/websites/${encodeURIComponent(name)}/content`, {
      method: 'DELETE',
      body: JSON.stringify({ paths }),
    }),

  websiteRemove: (name: string) =>
    request<{ success: boolean }>(`/websites/${encodeURIComponent(name)}`, { method: 'DELETE' }),

  // --- WireGuard ---
  wgClientConfig: () => request<WGClientConfig>('/wg/config'),

  wgUniqueIP: () => request<{ ip: string }>('/wg/ip'),

  wgForwarders: (sessionId: string) =>
    request<{ forwarders: WGTCPForwarder[] }>(`/sessions/${encodeURIComponent(sessionId)}/wg/forwarders`),

  wgStartPortForward: (sessionId: string, localPort: number, remoteAddress: string) =>
    request<{ forwarder: WGTCPForwarder; async: boolean }>(`/sessions/${encodeURIComponent(sessionId)}/wg/forwarders`, {
      method: 'POST',
      body: JSON.stringify({ local_port: localPort, remote_address: remoteAddress }),
    }),

  wgStopPortForward: (sessionId: string, id: number) =>
    request<{ forwarder: WGTCPForwarder; async: boolean }>(
      `/sessions/${encodeURIComponent(sessionId)}/wg/forwarders/${id}`,
      { method: 'DELETE' },
    ),

  wgSocksServers: (sessionId: string) =>
    request<{ servers: WGSocksServer[] }>(`/sessions/${encodeURIComponent(sessionId)}/wg/socks`),

  wgStartSocks: (sessionId: string, port: number) =>
    request<{ server: WGSocksServer; async: boolean }>(`/sessions/${encodeURIComponent(sessionId)}/wg/socks`, {
      method: 'POST',
      body: JSON.stringify({ port }),
    }),

  wgStopSocks: (sessionId: string, id: number) =>
    request<{ server: WGSocksServer; async: boolean }>(
      `/sessions/${encodeURIComponent(sessionId)}/wg/socks/${id}`,
      { method: 'DELETE' },
    ),

  // --- Privilege escalation ---
  getPrivs: (sessionId: string) =>
    request<{ privileges: WindowsPrivilege[] }>(`/sessions/${encodeURIComponent(sessionId)}/privs`),

  currentTokenOwner: (sessionId: string) =>
    request<{ owner: string }>(`/sessions/${encodeURIComponent(sessionId)}/token-owner`),

  executeToken: (sessionId: string, path: string, args: string[], output: boolean) =>
    request<ExecResult>(`/sessions/${encodeURIComponent(sessionId)}/execute-token`, {
      method: 'POST',
      body: JSON.stringify({ path, args, output }),
    }),

  runAs: (sessionId: string, username: string, processName: string, args: string) =>
    request<{ output: string; async: boolean }>(`/sessions/${encodeURIComponent(sessionId)}/runas`, {
      method: 'POST',
      body: JSON.stringify({ username, process_name: processName, args }),
    }),

  // --- Pivots ---
  pivotGraph: () => request<{ Children: PivotGraphEntry[] }>(`/pivots/graph`),

  pivotListeners: (sessionId: string) =>
    request<{ listeners: PivotListener[] }>(`/sessions/${encodeURIComponent(sessionId)}/pivots/listeners`),

  pivotStartListener: (sessionId: string, type: string, bindAddress: string) =>
    request<PivotListener>(`/sessions/${encodeURIComponent(sessionId)}/pivots/listeners`, {
      method: 'POST',
      body: JSON.stringify({ type, bind_address: bindAddress }),
    }),

  pivotStopListener: (sessionId: string, id: number) =>
    request<{ ok: boolean }>(`/sessions/${encodeURIComponent(sessionId)}/pivots/listeners/${id}`, {
      method: 'DELETE',
    }),

  // --- Windows services ---
  startService: (sessionId: string, opts: { service_name: string; description?: string; bin_path?: string; hostname?: string; arguments?: string }) =>
    request<{ success: boolean }>(`/sessions/${encodeURIComponent(sessionId)}/services`, {
      method: 'POST',
      body: JSON.stringify(opts),
    }),

  stopService: (sessionId: string, serviceName: string, hostname?: string) =>
    request<{ success: boolean }>(`/sessions/${encodeURIComponent(sessionId)}/services/stop`, {
      method: 'POST',
      body: JSON.stringify({ service_name: serviceName, hostname: hostname || '' }),
    }),

  removeService: (sessionId: string, serviceName: string, hostname?: string) =>
    request<{ success: boolean }>(`/sessions/${encodeURIComponent(sessionId)}/services/remove`, {
      method: 'POST',
      body: JSON.stringify({ service_name: serviceName, hostname: hostname || '' }),
    }),

  // --- SSH ---
  runSSHCommand: (sessionId: string, opts: { username: string; hostname: string; port?: number; command: string; password?: string; priv_key?: string }) =>
    request<SSHCommandResult>(`/sessions/${encodeURIComponent(sessionId)}/ssh`, {
      method: 'POST',
      body: JSON.stringify(opts),
    }),

  // --- Extensions ---
  listExtensions: (sessionId: string) =>
    request<{ names: string[] }>(`/sessions/${encodeURIComponent(sessionId)}/extensions`),

  registerExtension: (sessionId: string, opts: { name: string; os: string; init: string; data_b64: string }) =>
    request<{ success: boolean }>(`/sessions/${encodeURIComponent(sessionId)}/extensions/register`, {
      method: 'POST',
      body: JSON.stringify(opts),
    }),

  callExtension: (sessionId: string, opts: { name: string; export: string; server_store?: boolean; args_b64?: string }) =>
    request<CallExtensionResult>(`/sessions/${encodeURIComponent(sessionId)}/extensions/call`, {
      method: 'POST',
      body: JSON.stringify(opts),
    }),

  // --- Metasploit ---
  msf: (sessionId: string, opts: { payload: string; lhost: string; lport: number; encoder?: string; iterations?: number }) =>
    request<{ success: boolean }>(`/sessions/${encodeURIComponent(sessionId)}/msf`, {
      method: 'POST',
      body: JSON.stringify(opts),
    }),

  msfRemote: (sessionId: string, opts: { payload: string; lhost: string; lport: number; encoder?: string; iterations?: number; pid: number }) =>
    request<{ success: boolean }>(`/sessions/${encodeURIComponent(sessionId)}/msf/remote`, {
      method: 'POST',
      body: JSON.stringify(opts),
    }),

  msfStage: (opts: { arch: string; format: string; port: number; host: string; os: string; protocol: string; bad_chars: string[] }) =>
    request<MsfStager>(`/msf/stage`, {
      method: 'POST',
      body: JSON.stringify(opts),
    }),

  // --- Implant operations ---
  backdoor: (sessionId: string, opts: { file_path: string; profile_name: string }) =>
    request<{ success: boolean }>(`/sessions/${encodeURIComponent(sessionId)}/backdoor`, {
      method: 'POST',
      body: JSON.stringify(opts),
    }),

  hijackDll: (sessionId: string, opts: { reference_dll_path: string; target_location: string; reference_dll_b64: string; target_dll_b64: string; profile_name: string }) =>
    request<{ success: boolean }>(`/sessions/${encodeURIComponent(sessionId)}/dll-hijack`, {
      method: 'POST',
      body: JSON.stringify(opts),
    }),

  shellcodeRdi: (opts: { data_b64: string; function_name: string; arguments: string }) =>
    request<{ DataB64: string; Size: number }>(`/shellcode/rdi`, {
      method: 'POST',
      body: JSON.stringify(opts),
    }),

  // --- DNS canaries ---
  canaries: () => request<{ canaries: Canary[] }>('/canaries'),

  regCreateKey: (sessionId: string, hive: string, path: string, key: string) =>
    request<{ success: boolean }>(`/sessions/${sessionId}/reg/create-key`, {
      method: 'POST',
      body: JSON.stringify({ hive, path, key }),
    }),
}

export function wsUrl(path: string): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}${path}`
}
