export interface Session {
  ID: string
  Name: string
  UUID: string
  Hostname: string
  Username: string
  UID: string
  GID: string
  PID: number
  OS: string
  Arch: string
  Transport: string
  RemoteAddress: string
  LastCheckin: string
  ActiveC2: string
  Locale: string
  AgentVersion: string
  IsDead: boolean
  IsInteractive: boolean
}

export interface Beacon {
  ID: string
  Name: string
  Hostname: string
  Username: string
  OS: string
  Arch: string
  Transport: string
  RemoteAddress: string
  LastCheckin: string
  NextCheckin: string
  Interval: number
  Jitter: number
  ActiveC2: string
}

export interface Listener {
  ID: number
  Name: string
  JobID: number
  Protocol: string
  Addr: string
  TLS: boolean
}

export interface Event {
  Type: string
  Err: string
  Session?: Session
  Beacon?: Beacon
  Job?: Job
  Data: Record<string, unknown>
}

export interface ServerInfo {
  version: string
  connected: boolean
  error?: string
}

export interface OverviewCounts {
  sessions: number
  beacons: number
  jobs: number
  builders: number
  socks: number
}

export interface OverviewData {
  counts: OverviewCounts
}

export interface ImplantConfig {
  name: string
  os: string
  arch: string
  format: string
  target: string
  c2: { address: string; protocol: string }[]
  mtls: boolean
  http: boolean
  dns: boolean
  wireguard: boolean
  interval: number
  jitter: number
  maxConnectionErrors: number
  debug: boolean
  evasion: boolean
  obfuscate: boolean
  limitDomainJoined: boolean
  transport: string
}

export interface ImplantBuild {
  Name: string
  ImplantConfig: ImplantConfig
  ImplantBuildID: string
  Arch: string
  OS: string
}

export interface Job {
  ID: number
  Name: string
  Protocol: string
  Port: number
  Domains: string[]
  JobControl: string
}

export interface LootEntry {
  ID: string
  Name: string
  LootType: string
  FileType: string
  File: string
  Size: number
  DataB64?: string
  CredUser?: string
  CredPassword?: string
  CredAPIKey?: string
}

export interface CompilerTarget {
  GOOS: string
  GOARCH: string
  Format: string
}

export interface CrossCompiler {
  TargetGOOS: string
  TargetGOARCH: string
  CCPath: string
  CXXPath: string
}

export interface CompilerInfo {
  GOOS: string
  GOARCH: string
  Targets: CompilerTarget[]
  CrossCompilers: CrossCompiler[]
}

export interface IOC {
  ID: string
  Path: string
  FileHash: string
}

export interface Host {
  Hostname: string
  HostUUID: string
  OSVersion: string
  IOCs: IOC[]
}

export interface WebContent {
  Path: string
  ContentType: string
  Size: number
  DataB64?: string
}

export interface Website {
  Name: string
  Contents: Record<string, WebContent>
  Size: number
}

export interface WGClientConfig {
  ServerPubKey: string
  ClientPrivateKey: string
  ClientPubKey: string
  ClientIP: string
}

export interface WGTCPForwarder {
  ID: number
  LocalAddr: string
  RemoteAddr: string
}

export interface WGSocksServer {
  ID: number
  LocalAddr: string
}

export interface Operator {
  Name: string
  FirstContact: string
  Sessions: number
  CanCleanup: boolean
}

export interface Canary {
  ImplantName: string
  Domain: string
  Triggered: boolean
  FirstTriggered?: string
  LatestTrigger?: string
  Count: number
}

export interface Credential {
  ID: number
  Username: string
  Plaintext: string
  Hash: string
  HashType: string
  Realm: string
  Collection: string
}

export interface Task {
  ID: number
  CreatedAt: string
  CompletedAt: string
  Description: string
  State: string
  Type: string
  SessionID: string
}

export interface GenerateResult {
  success: boolean
  message: string
  path?: string
  name?: string
  data?: string
}

export interface FileInfo {
  name: string
  path: string
  size: number
  isDir: boolean
}

export interface FileEntry {
  Name: string
  IsDir: boolean
  Size: number
  ModTime: number
  Mode: string
}

export interface DirView {
  Path: string
  Exists: boolean
  Files: FileEntry[]
}

export interface NetInterface {
  Index: number
  Name: string
  MAC: string
  IPAddresses: string[]
}

export interface ProcessInfo {
  PID: number
  PPID: number
  Executable: string
  Owner: string
  SessionID: number
  CmdLine: string[]
}

export interface SockEntry {
  Protocol: string
  LocalAddr: string
  LocalPort: number
  RemoteAddr: string
  RemotePort: number
  State: string
  UID: number
  ProcessName: string
}

export interface EnvVar {
  Key: string
  Value: string
}

export interface ExecResult {
  Status: number
  Stdout: string
  Stderr: string
  PID: number
}

export interface WindowsPrivilege {
  Name: string
  Description: string
  Enabled: boolean
  EnabledByDefault: boolean
  Removed: boolean
  UsedForAccess: boolean
}

export interface NetConnPivot {
  PeerID: number
  RemoteAddress: string
}

export interface PivotListener {
  ID: number
  Type: string
  BindAddress: string
  Pivots: NetConnPivot[]
}

export interface PivotGraphEntry {
  PeerID: number
  Name: string
  SessionID: string
  Hostname: string
  Username: string
  OS: string
  Transport: string
  RemoteAddress: string
  Children: PivotGraphEntry[]
}

export interface SSHCommandResult {
  StdOut: string
  StdErr: string
}

export interface CallExtensionResult {
  Output: string
  ServerStore: boolean
}

export interface MsfStager {
  FileName: string
  DataB64: string
  Size: number
}

export interface PortForward {
  LocalAddr: string
  LocalPort: number
  Host: string
  Port: number
  SessionID: string
}

export interface BeaconTask {
  ID: string
  BeaconID: string
  CreatedAt: number
  State: string
  SentAt: number
  CompletedAt: number
  Description: string
  ResponseB64?: string
}

export interface SocksProxy {
  ID: number
  SessionID: string
  BindAddr: string
  BindPort: number
  Username: string
  Password: string
}

export interface ImplantProfile {
  Name: string
  Config?: ImplantConfigView
}

export interface ImplantConfigView {
  Name: string
  OS: string
  Arch: string
  Format: string
  Interval: number
  Jitter: number
  Obfuscate: boolean
  Debug: boolean
  Evasion: boolean
  MaxConnectionErrors: number
  IsBeacon: boolean
  BeaconInterval: number
  BeaconJitter: number
  C2: { URL: string }[]
}

export interface Alias {
  Name: string
  Version: string
  CommandName: string
  OriginalAuthor: string
  RepoURL: string
  Help: string
  Entrypoint: string
  AllowArgs: boolean
  DefaultArgs: string
  Platforms: string[]
  IsAssembly: boolean
  IsReflective: boolean
}

