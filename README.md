# Sliver UI

为 [Sliver](https://github.com/BishopFox/sliver) C2 框架构建的图形化管理界面（桌面客户端形态的 Web 应用）。

## 架构

```
+------------------------------------------+
| React 前端 (Vite + xterm.js)              |
|   Sessions / Beacons / Listeners /        |
|   Implants / Events / Settings            |
+--------------------+---------------------+
                     | REST + WebSocket
+--------------------+---------------------+
| Go 后端 (gRPC 桥接层)                    |
|   mTLS 连接 sliver-server (默认 31337)   |
|   读取 ~/.sliver-client/configs 配置      |
+--------------------+---------------------+
                     | gRPC (mTLS)
+--------------------+---------------------+
|              sliver-server               |
+------------------------------------------+
```

## 功能

- **Sessions**：在线会话列表（主机、用户、OS/Arch、传输方式、最后回连时间），一键打开交互终端
- **Terminal**：基于 xterm.js + WebSocket 的交互式 shell（通过 Sliver 隧道）
- **Session 详情**：按会话标签页管理以下能力：
  - **Files**：目录浏览、进入/返回、新建目录、删除、上传、下载、查看文本文件（`Ls/Cd/Pwd/Mkdir/Rm/Upload/Download`）
  - **Processes**：进程列表、结束进程（`Ps/Terminate`）
  - **Network**：网络接口（`Ifconfig`）与连接表（`Netstat`）
  - **Env**：查看 / 设置 / 删除环境变量（`GetEnv/SetEnv/UnsetEnv`）
  - **Exec**：执行命令并查看 stdout/stderr/退出码（`Execute`）
  - **Screenshot**：截取目标屏幕（`Screenshot`）
  - **Portfwd**：本地端口 → 目标主机的端口转发（`Portfwd`）
  - **Registry**（Windows）：按 hive/path 浏览注册表子键与值、读写值（`RegistryRead/Write/ListSubKeys/ListValues`）
  - **Rename**：会话 / beacon 重命名（`Rename`）
- **Beacons**：beacon 模式主机列表，支持重命名、删除（`RmBeacon`）、查看任务队列与任务内容（`GetBeaconTasks/GetBeaconTaskContent`）
- **SOCKS5**：本地监听 → 会话隧道的 SOCKS5 代理（`CreateSocks/SocksProxy`，植入体端运行 SOCKS5 服务器）
- **Implant Profiles**：将当前生成表单保存为 implant 配置模板，可复用 / 删除（`ImplantProfiles/SaveImplantProfile/DeleteImplantProfile`）
- **Listeners**：启动/停止 mTLS、HTTP(S)、DNS、WireGuard 监听器
- **Implants**：生成 implant（OS/Arch/格式/C2 配置/混淆选项），查看已构建产物
- **Events**：服务器事件流
- **Settings**：选择已保存的 sliver-client profile 连接服务器

## 快速开始

### 前提

- 一个运行中的 `sliver-server`
- `~/.sliver-client/configs/` 下存在已保存的 profile（`sliver-client` 登录后自动生成）
- Go `1.25.6+`（可由 `GOTOOLCHAIN=auto` 自动下载）
- Node.js `20+` 与 npm `10+`

Windows 上如使用火绒等安全软件，建议保持脚本中的 `GOTMPDIR=.gotmp` 配置，避免 `%TEMP%` 中生成的 Go 测试/构建二进制被拦截。

### 运行

```bash
./start.sh
```

Windows 可用：

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

或手动启动：

```bash
cd backend && go run . --addr 127.0.0.1:8080
cd frontend && npm run dev
```

前端开发服务器运行在 `http://localhost:5173`，通过 Vite 反向代理将 `/api` 和 `/ws` 转发到后端 `:8080`。

## 测试

### 后端（Go 单元测试）

```bash
cd backend && go test ./...
```

若本机安全软件拦截 `%TEMP%` 中的 Go 测试二进制，可改用项目内临时目录：

```bash
mkdir -p ../.gotmp
export GOTMPDIR="$PWD/../.gotmp"
go test ./...
```

覆盖 profile 加载（`ListProfiles`/`LoadProfile`）、连接参数校验、会话/beacon/事件视图转换、C2 URL 构建等纯逻辑。

### 前端（Vitest + React Testing Library）

```bash
cd frontend && npm test
```

覆盖 API client（fetch mock）与页面组件（SessionsPage 渲染/空态/错误态）。测试运行在 jsdom 环境，配置见 `vite.config.ts` 的 `test` 段。

## 打包为桌面客户端

本项目采用「Web 前端 + Go 桥接层」架构，可直接用以下任一方式打包为桌面应用：

- **Wails**：Go 后端原生支持，将前端构建产物嵌入 Wails 项目即可（需系统 WebView 依赖）
- **Electron / Tauri**：加载前端构建产物或生产模式的静态服务地址

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/info` | 连接状态与服务器版本 |
| POST | `/api/connect` | 按 profile 连接 |
| POST | `/api/disconnect` | 断开当前连接 |
| GET | `/api/profiles` | 列出已保存配置 |
| POST | `/api/profiles/:name` | 使用指定配置连接 |
| GET | `/api/sessions` | 会话列表 |
| GET | `/api/beacons` | beacon 列表 |
| GET | `/api/jobs` | 监听器任务列表 |
| POST | `/api/listeners` | 启动监听器 |
| DELETE | `/api/listeners/:id` | 停止监听器 |
| GET | `/api/builders` | implant 构建列表 |
| POST | `/api/generate` | 生成 implant |
| GET | `/api/events` | 事件流 |
| WS | `/ws/sessions/:id/terminal` | 交互终端 |
| GET | `/api/sessions/:id/fs` | 目录列表 |
| GET | `/api/sessions/:id/fs/pwd` | 当前目录 |
| POST | `/api/sessions/:id/fs/cd` | 切换目录 |
| GET | `/api/sessions/:id/fs/cat` | 读取文本文件 |
| GET | `/api/sessions/:id/fs/download` | 下载文件（base64） |
| POST | `/api/sessions/:id/fs/upload` | 上传文件（base64） |
| POST | `/api/sessions/:id/fs/mkdir` | 新建目录 |
| DELETE | `/api/sessions/:id/fs?path=...&recursive=...` | 删除文件/目录 |
| POST | `/api/sessions/:id/fs/mv` | 移动/重命名 |
| GET | `/api/sessions/:id/ifconfig` | 网络接口 |
| GET | `/api/sessions/:id/ps` | 进程列表 |
| POST | `/api/sessions/:id/ps/kill` | 结束进程 |
| POST | `/api/sessions/:id/kill` | 结束会话 |
| GET | `/api/sessions/:id/netstat` | 连接表 |
| GET | `/api/sessions/:id/env` | 环境变量 |
| POST | `/api/sessions/:id/env` | 设置环境变量 |
| DELETE | `/api/sessions/:id/env/:key` | 删除环境变量 |
| POST | `/api/sessions/:id/exec` | 执行命令 |
| GET | `/api/sessions/:id/screenshot` | 截屏 |
| POST | `/api/sessions/:id/exec-assembly` | 执行 .NET assembly |
| POST | `/api/sessions/:id/sideload` | 加载 DLL 到进程 |
| POST | `/api/sessions/:id/spawn-dll` | 启动并加载 DLL |
| POST | `/api/sessions/:id/migrate` | 迁移会话进程 |
| POST | `/api/sessions/:id/process-dump` | 导出进程内存 |
| POST | `/api/sessions/:id/impersonate` | 模拟指定用户 |
| POST | `/api/sessions/:id/make-token` | 创建用户 token |
| POST | `/api/sessions/:id/rev-to-self` | 恢复原始 token |
| POST | `/api/sessions/:id/getsystem` | 提升为 SYSTEM 权限 |
| POST | `/api/sessions/:id/ping` | 会话连通性测试 |
| GET | `/api/portfwd` | 端口转发列表 |
| POST | `/api/portfwd` | 启动端口转发 |
| DELETE | `/api/portfwd/:port` | 停止端口转发 |
| GET | `/api/sessions/:id/reg/subkeys` | 注册表子键 |
| GET | `/api/sessions/:id/reg/values` | 注册表值 |
| GET | `/api/sessions/:id/reg/read` | 读注册表值 |
| POST | `/api/sessions/:id/reg/write` | 写注册表值 |
| POST | `/api/sessions/:id/reg/create-key` | 新建注册表键 |
| POST | `/api/sessions/:id/rename` | 重命名会话 |
| POST | `/api/beacons/:id/rename` | 重命名 beacon |
| DELETE | `/api/beacons/:id` | 删除 beacon |
| GET | `/api/beacons/:id/tasks` | beacon 任务队列 |
| GET | `/api/beacons/:id/tasks/:taskID` | beacon 任务内容 |
| GET | `/api/implant-profiles` | implant 配置模板列表 |
| POST | `/api/implant-profiles` | 保存 implant 配置模板 |
| DELETE | `/api/implant-profiles/:name` | 删除 implant 配置模板 |
| DELETE | `/api/implant-builds/:name` | 删除 implant 构建产物 |
| POST | `/api/regenerate` | 重新生成 implant |
| GET | `/api/operators` | 操作员列表 |
| GET | `/api/socks` | SOCKS5 代理列表 |
| POST | `/api/socks` | 启动 SOCKS5 代理 |
| DELETE | `/api/socks/:id` | 停止 SOCKS5 代理 |
