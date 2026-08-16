import { describe, it, expect, vi, beforeEach } from 'vitest'
import routes from '../__fixtures__/routes.json'
import { api } from '../api'

interface RoutePattern {
  method: string
  pattern: string
}

// Ground truth from the backend (backend/internal/api/routes.json, kept in
// sync by TestRouteTableFixture). Patterns are compared without the /api
// prefix, matching the paths api.ts passes to request().
const backend = new Set((routes as RoutePattern[]).map((r) => `${r.method} ${r.pattern.replace(/^\/api/, '')}`))

// Cast a Go-style path placeholder token to a numeric param.
const asNum = (s: string) => s as unknown as number

describe('frontend/backend route contract', () => {
  const calls: { url: string; method: string }[] = []
  const fetchMock = vi.fn(async (url: string, opts?: RequestInit) => {
    calls.push({ url, method: opts?.method || 'GET' })
    return { ok: true, status: 200, json: async () => ({}) }
  })

  beforeEach(() => {
    calls.length = 0
    vi.stubGlobal('fetch', fetchMock)
  })

  it('every path api.ts calls exists in the backend route table', async () => {
    await Promise.all([
      api.info(),
      api.overview(),
      api.connect({ content: '{}' }),
      api.disconnect(),
      api.listProfiles(),
      api.useProfile('{name}'),
      api.sessions(),
      api.beacons(),
      api.beacon('{id}'),
      api.openSessionFromBeacon('{id}'),
      api.closeSession('{id}'),
      api.monitorStart(),
      api.monitorStop(),
      api.jobs(),
      api.events(),
      api.builders(),
      api.generate({ name: 'x', os: 'windows' }),
      api.startListener({ type: 'mtls', addr: '', port: 1, tls: false }),
      api.stopListener(asNum('{id}')),
      api.killSession('{id}'),
      api.renameSession('{id}', 'x'),
      api.renameBeacon('{id}', 'x'),
      api.rmBeacon('{id}'),
      api.beaconTasks('{id}'),
      api.beaconTaskContent('{id}', '{taskID}'),
      api.lootList(),
      api.lootContent('{id}'),
      api.lootRemove('{id}'),
      api.lootAdd({ type: 'file', name: 'x' }),
      api.lootRename('{id}', 'x'),
      api.implantProfiles(),
      api.saveImplantProfile({ name: 'x', is_beacon: false, config: {} }),
      api.deleteImplantProfile('{name}'),
      api.socksList(),
      api.socksStart({ session_id: '{id}' }),
      api.socksStop(asNum('{id}')),
      api.fsList('{id}'),
      api.fsPwd('{id}'),
      api.fsCd('{id}', 'x'),
      api.fsCat('{id}', 'x'),
      api.fsDownload('{id}', 'x'),
      api.fsUpload('{id}', 'x', ''),
      api.fsMkdir('{id}', 'x'),
      api.fsRm('{id}', 'x'),
      api.fsMv('{id}', 'a', 'b'),
      api.ifconfig('{id}'),
      api.ps('{id}'),
      api.killProcess('{id}', 1),
      api.netstat('{id}'),
      api.env('{id}'),
      api.setEnv('{id}', 'k', 'v'),
      api.unsetEnv('{id}', '{key}'),
      api.exec('{id}', 'x', []),
      api.screenshot('{id}'),
      api.execAssembly('{id}', '', '', ''),
      api.sideload('{id}', '', '', '', ''),
      api.spawnDll('{id}', '', '', '', ''),
      api.migrate('{id}', 1),
      api.processDump('{id}', 1),
      api.impersonate('{id}', ''),
      api.makeToken('{id}', '', '', ''),
      api.revToSelf('{id}'),
      api.getSystem('{id}', ''),
      api.ping('{id}'),
      api.deleteImplantBuild('{name}'),
      api.regenerate('x'),
      api.getOperators(),
      api.compiler(),
      api.hosts(),
      api.host('{uuid}'),
      api.hostRemove('{uuid}'),
      api.hostIOCRm('{uuid}', '{iocID}'),
      api.websites(),
      api.website('{name}'),
      api.websiteAddContent('{name}', { path: 'x' }),
      api.websiteUpdateContent('{name}', { path: 'x' }),
      api.websiteRemoveContent('{name}', ['x']),
      api.websiteRemove('{name}'),
      api.wgClientConfig(),
      api.wgUniqueIP(),
      api.wgForwarders('{id}'),
      api.wgStartPortForward('{id}', 1, 'x'),
      api.wgStopPortForward('{id}', asNum('{fwdID}')),
      api.wgSocksServers('{id}'),
      api.wgStartSocks('{id}', 1),
      api.wgStopSocks('{id}', asNum('{serverID}')),
      api.getPrivs('{id}'),
      api.currentTokenOwner('{id}'),
      api.executeToken('{id}', 'x', [], true),
      api.runAs('{id}', 'u', 'p', 'a'),
      api.pivotGraph(),
      api.pivotListeners('{id}'),
      api.pivotStartListener('{id}', 'tcp', ''),
      api.pivotStopListener('{id}', asNum('{pivotID}')),
      api.startService('{id}', { service_name: 'x' }),
      api.stopService('{id}', 'x'),
      api.removeService('{id}', 'x'),
      api.runSSHCommand('{id}', { username: 'u', hostname: 'h', command: 'c' }),
      api.listExtensions('{id}'),
      api.registerExtension('{id}', { name: 'x', os: 'o', init: 'i', data_b64: '' }),
      api.callExtension('{id}', { name: 'x', export: 'm' }),
      api.msf('{id}', { payload: 'p', lhost: 'l', lport: 1 }),
      api.msfRemote('{id}', { payload: 'p', lhost: 'l', lport: 1, pid: 1 }),
      api.msfStage({ arch: 'a', format: 'f', port: 1, host: 'h', os: 'o', protocol: 'p', bad_chars: [] }),
      api.backdoor('{id}', { file_path: 'x', profile_name: 'p' }),
      api.hijackDll('{id}', {
        reference_dll_path: 'x',
        target_location: 'x',
        reference_dll_b64: '',
        target_dll_b64: '',
        profile_name: 'p',
      }),
      api.shellcodeRdi({ data_b64: '', function_name: 'f', arguments: '' }),
      api.execShellcode('{id}', { data_b64: '', pid: 1, rwx_pages: false }),
      api.psexec('{id}', { hostname: 'h', profile_name: 'p', service_name: 's', service_desc: '', bin_path: '' }),
      api.canaries(),
      api.pruneBeacons(1),
      api.pruneSessions(),
      api.aliases(),
      api.aliasInstall(''),
      api.aliasRemove('{name}'),
      api.aliasRun('{id}', '{name}', {}),
      api.regSubKeys('{id}', 'H', 'p'),
      api.regValues('{id}', 'H', 'p'),
      api.regRead('{id}', 'H', 'p', 'k'),
      api.regWrite('{id}', 'H', 'p', 'k', 'v'),
      api.regDeleteKey('{id}', 'H', 'p', 'k'),
      api.regCreateKey('{id}', 'H', 'p', 'k'),
      api.reconfigureSession('{id}', 1),
    ])

    expect(calls.length).toBeGreaterThan(0)
    for (const c of calls) {
      const path = decodeURIComponent(new URL(c.url, 'http://localhost').pathname).replace(/^\/api/, '')
      const key = `${c.method} ${path}`
      expect(backend.has(key), `${c.method} ${c.url} is not declared in the backend route table`).toBe(true)
    }
  })
})
