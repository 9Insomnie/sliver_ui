package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"sliverui/internal/sliver"
)

// Server holds the HTTP API handlers and the current Sliver connection.
type Server struct {
	mu     sync.RWMutex
	client *sliver.Client
}

// New creates an API server.
func New() *Server {
	return &Server{}
}

func (s *Server) Client() *sliver.Client {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.client
}

func (s *Server) SetClient(c *sliver.Client) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.client != nil {
		s.client.Close()
	}
	s.client = c
}

func (s *Server) ClearClient() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.client != nil {
		s.client.Close()
		s.client = nil
	}
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]string{"error": msg})
}

func (s *Server) requireClient(w http.ResponseWriter) *sliver.Client {
	c := s.Client()
	if c == nil {
		writeErr(w, http.StatusServiceUnavailable, "not connected to sliver-server")
		return nil
	}
	return c
}

// Routes registers all HTTP handlers.
func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/info", s.handleInfo)
	mux.HandleFunc("GET /api/overview", s.handleOverview)
	mux.HandleFunc("POST /api/connect", s.handleConnect)
	mux.HandleFunc("POST /api/disconnect", s.handleDisconnect)
	mux.HandleFunc("GET /api/profiles", s.handleListProfiles)
	mux.HandleFunc("POST /api/profiles/{name}", s.handleUseProfile)

	mux.HandleFunc("GET /api/sessions", s.handleSessions)
	mux.HandleFunc("POST /api/sessions/{id}/kill", s.handleKillSession)
	mux.HandleFunc("GET /api/sessions/{id}/fs", s.handleFsList)
	mux.HandleFunc("GET /api/sessions/{id}/fs/pwd", s.handleFsPwd)
	mux.HandleFunc("POST /api/sessions/{id}/fs/cd", s.handleFsCd)
	mux.HandleFunc("GET /api/sessions/{id}/fs/cat", s.handleFsCat)
	mux.HandleFunc("GET /api/sessions/{id}/fs/download", s.handleFsDownload)
	mux.HandleFunc("POST /api/sessions/{id}/fs/upload", s.handleFsUpload)
	mux.HandleFunc("POST /api/sessions/{id}/fs/mkdir", s.handleFsMkdir)
	mux.HandleFunc("DELETE /api/sessions/{id}/fs", s.handleFsRm)
	mux.HandleFunc("POST /api/sessions/{id}/fs/mv", s.handleFsMv)

	mux.HandleFunc("GET /api/sessions/{id}/ifconfig", s.handleIfconfig)
	mux.HandleFunc("GET /api/sessions/{id}/ps", s.handlePs)
	mux.HandleFunc("POST /api/sessions/{id}/ps/kill", s.handleKillProcess)
	mux.HandleFunc("GET /api/sessions/{id}/netstat", s.handleNetstat)
	mux.HandleFunc("GET /api/sessions/{id}/env", s.handleGetEnv)
	mux.HandleFunc("POST /api/sessions/{id}/env", s.handleSetEnv)
	mux.HandleFunc("DELETE /api/sessions/{id}/env/{key}", s.handleUnsetEnv)
	mux.HandleFunc("POST /api/sessions/{id}/exec", s.handleExec)
	mux.HandleFunc("GET /api/sessions/{id}/screenshot", s.handleScreenshot)

	// Extended session operations (P1)
	mux.HandleFunc("POST /api/sessions/{id}/exec-assembly", s.handleExecAssembly)
	mux.HandleFunc("POST /api/sessions/{id}/sideload", s.handleSideload)
	mux.HandleFunc("POST /api/sessions/{id}/spawn-dll", s.handleSpawnDll)
	mux.HandleFunc("POST /api/sessions/{id}/migrate", s.handleMigrate)
	mux.HandleFunc("POST /api/sessions/{id}/process-dump", s.handleProcessDump)
	mux.HandleFunc("POST /api/sessions/{id}/impersonate", s.handleImpersonate)
	mux.HandleFunc("POST /api/sessions/{id}/make-token", s.handleMakeToken)
	mux.HandleFunc("POST /api/sessions/{id}/rev-to-self", s.handleRevToSelf)
	mux.HandleFunc("POST /api/sessions/{id}/getsystem", s.handleGetSystem)
	mux.HandleFunc("POST /api/sessions/{id}/ping", s.handlePing)

	mux.HandleFunc("GET /api/sessions/{id}/reg/subkeys", s.handleRegSubKeys)
	mux.HandleFunc("GET /api/sessions/{id}/reg/values", s.handleRegValues)
	mux.HandleFunc("GET /api/sessions/{id}/reg/read", s.handleRegRead)
	mux.HandleFunc("POST /api/sessions/{id}/reg/write", s.handleRegWrite)
	mux.HandleFunc("POST /api/sessions/{id}/reg/create-key", s.handleRegCreateKey)
	mux.HandleFunc("POST /api/sessions/{id}/reg/delete-key", s.handleRegDeleteKey)
	mux.HandleFunc("POST /api/sessions/{id}/reconfigure", s.handleReconfigure)

	mux.HandleFunc("GET /api/portfwd", s.handlePortfwdList)
	mux.HandleFunc("POST /api/portfwd", s.handlePortfwdStart)
	mux.HandleFunc("DELETE /api/portfwd/{port}", s.handlePortfwdStop)

	mux.HandleFunc("GET /api/beacons", s.handleBeacons)
	mux.HandleFunc("GET /api/beacons/{id}", s.handleBeacon)
	mux.HandleFunc("POST /api/beacons/{id}/rename", s.handleRenameBeacon)
	mux.HandleFunc("DELETE /api/beacons/{id}", s.handleRmBeacon)
	mux.HandleFunc("GET /api/beacons/{id}/tasks", s.handleBeaconTasks)
	mux.HandleFunc("GET /api/beacons/{id}/tasks/{taskID}", s.handleBeaconTaskContent)
	mux.HandleFunc("POST /api/sessions/{id}/rename", s.handleRenameSession)

	mux.HandleFunc("GET /api/implant-profiles", s.handleImplantProfiles)
	mux.HandleFunc("POST /api/implant-profiles", s.handleSaveImplantProfile)
	mux.HandleFunc("DELETE /api/implant-profiles/{name}", s.handleDeleteImplantProfile)
	mux.HandleFunc("DELETE /api/implant-builds/{name}", s.handleDeleteImplantBuild)
	mux.HandleFunc("POST /api/regenerate", s.handleRegenerate)
	mux.HandleFunc("GET /api/operators", s.handleGetOperators)
	mux.HandleFunc("GET /api/compiler", s.handleCompiler)

	mux.HandleFunc("GET /api/socks", s.handleSocksList)
	mux.HandleFunc("POST /api/socks", s.handleSocksStart)
	mux.HandleFunc("DELETE /api/socks/{id}", s.handleSocksStop)

	mux.HandleFunc("GET /api/loot", s.handleLootAll)
	mux.HandleFunc("POST /api/loot", s.handleLootAdd)
	mux.HandleFunc("POST /api/loot/{id}/rename", s.handleLootRename)
	mux.HandleFunc("GET /api/loot/{id}", s.handleLootContent)
	mux.HandleFunc("DELETE /api/loot/{id}", s.handleLootRemove)
	mux.HandleFunc("GET /api/jobs", s.handleJobs)
	mux.HandleFunc("GET /api/events", s.handleEvents)
	mux.HandleFunc("GET /api/builders", s.handleBuilders)
	mux.HandleFunc("POST /api/generate", s.handleGenerate)
	mux.HandleFunc("POST /api/listeners", s.handleListeners)
	mux.HandleFunc("DELETE /api/listeners/{id}", s.handleStopListener)
	mux.HandleFunc("/ws/sessions/{id}/terminal", s.handleTerminalWS)

	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		writeErr(w, http.StatusNotFound, "not found")
	})
	mux.HandleFunc("/ws/", func(w http.ResponseWriter, r *http.Request) {
		writeErr(w, http.StatusNotFound, "not found")
	})
	mux.HandleFunc("/", handleStatic)

	return withCORS(withLogging(mux))
}

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		fmt.Printf("[api] %s %s (%s)\n", r.Method, r.URL.Path, time.Since(start))
	})
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) handleInfo(w http.ResponseWriter, r *http.Request) {
	c := s.Client()
	if c == nil {
		writeJSON(w, http.StatusOK, map[string]any{"connected": false})
		return
	}
	ver, err := c.Version()
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]any{"connected": false, "error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"connected": true, "version": ver})
}

// handleOverview aggregates top-level counts for the sidebar badges and dashboard.
func (s *Server) handleOverview(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	type countResult struct {
		key string
		n   int
		err error
	}
	results := make(chan countResult, 8)
	run := func(key string, fn func() (int, error)) {
		go func() {
			n, err := fn()
			results <- countResult{key: key, n: n, err: err}
		}()
	}

	run("sessions", func() (int, error) {
		ss, err := c.Sessions()
		return len(ss), err
	})
	run("beacons", func() (int, error) {
		bs, err := c.Beacons()
		return len(bs), err
	})
	run("jobs", func() (int, error) {
		js, err := c.Jobs()
		return len(js), err
	})
	run("builders", func() (int, error) {
		bs, err := c.ImplantBuilds()
		return len(bs), err
	})
	run("socks", func() (int, error) {
		return len(c.Socks().List()), nil
	})

	out := map[string]int{"sessions": 0, "beacons": 0, "jobs": 0, "builders": 0, "socks": 0}
	timeout := time.After(12 * time.Second)
	for i := 0; i < 5; i++ {
		select {
		case res := <-results:
			if res.err == nil {
				out[res.key] = res.n
			}
		case <-timeout:
			writeErr(w, http.StatusGatewayTimeout, "overview collection timed out")
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"counts": out})
}

type connectRequest struct {
	Name   string `json:"name"`
	LHost  string `json:"lhost"`
	LPort  int    `json:"lport"`
	CA     string `json:"ca"`
	Cert   string `json:"cert"`
	Key    string `json:"key"`
}

func (s *Server) handleConnect(w http.ResponseWriter, r *http.Request) {
	var req connectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}
	cfg, err := sliver.LoadProfile(req.Name)
	if err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.LHost != "" {
		cfg.LHost = req.LHost
	}
	if req.LPort != 0 {
		cfg.LPort = req.LPort
	}
	client, err := sliver.Connect(cfg)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	s.SetClient(client)
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (s *Server) handleDisconnect(w http.ResponseWriter, r *http.Request) {
	s.ClearClient()
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (s *Server) handleListProfiles(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"profiles": sliver.ListProfiles()})
}

func (s *Server) handleUseProfile(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	if name == "" {
		writeErr(w, http.StatusBadRequest, "invalid profile name")
		return
	}
	cfg, err := sliver.LoadProfile(name)
	if err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}
	client, err := sliver.Connect(cfg)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	s.SetClient(client)
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (s *Server) handleSessions(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	sessions, err := c.Sessions()
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"sessions": sessions})
}

func (s *Server) handleBeacons(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	beacons, err := c.Beacons()
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"beacons": beacons})
}

func (s *Server) handleJobs(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	jobs, err := c.Jobs()
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"jobs": jobs})
}

func (s *Server) handleEvents(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	events, err := c.Events()
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"events": events})
}

func (s *Server) handleKillSession(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	id := r.PathValue("id")
	if id == "" {
		writeErr(w, http.StatusBadRequest, "invalid session id")
		return
	}
	if err := c.KillSession(id); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (s *Server) handleBuilders(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	builds, err := c.ImplantBuilds()
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"builders": builds})
}

func (s *Server) handleGenerate(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	var req sliver.GenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}
	result, err := c.GenerateImplant(&req)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (s *Server) handleListeners(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	var req struct {
		Type string `json:"type"`
		Addr string `json:"addr"`
		Port int    `json:"port"`
		TLS  bool   `json:"tls"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid request body")
		return
	}
	addr := req.Addr
	if addr == "" {
		addr = "0.0.0.0"
	}
	port := uint32(req.Port)
	if port == 0 {
		switch req.Type {
		case "mtls":
			port = 8888
		case "dns":
			port = 53
		case "wireguard":
			port = 53
		default:
			port = 80
		}
	}
	jobID, err := c.StartListener(req.Type, addr, port, req.TLS)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "job_id": jobID})
}

func (s *Server) handleStopListener(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	id, err := strconv.ParseUint(r.PathValue("id"), 10, 32)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid job id")
		return
	}
	if err := c.StopJob(uint32(id)); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}
