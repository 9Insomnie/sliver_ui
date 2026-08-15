package api

import (
	"net/http"
	"strconv"

	"sliverui/internal/sliver"
)

// --- Session / Beacon management ---

func (s *Server) handleRenameSession(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	var req struct {
		Name string `json:"name"`
	}
	if !decodeBody(w, r, &req) {
		return
	}
	if err := c.RenameSession(r.PathValue("id"), req.Name); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (s *Server) handleRenameBeacon(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	var req struct {
		Name string `json:"name"`
	}
	if !decodeBody(w, r, &req) {
		return
	}
	if err := c.RenameBeacon(r.PathValue("id"), req.Name); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (s *Server) handleRmBeacon(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	if err := c.RmBeacon(r.PathValue("id")); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (s *Server) handleBeaconTasks(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	tasks, err := c.BeaconTasks(r.PathValue("id"))
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"tasks": tasks})
}

func (s *Server) handleBeaconTaskContent(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	task, err := c.BeaconTaskContent(r.PathValue("taskID"))
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, task)
}

// --- Implant profiles ---

func (s *Server) handleImplantProfiles(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	profiles, err := c.ImplantProfiles()
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"profiles": profiles})
}

func (s *Server) handleSaveImplantProfile(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	var req struct {
		Name     string                `json:"name"`
		IsBeacon bool                  `json:"is_beacon"`
		Config   sliver.GenerateRequest `json:"config"`
	}
	if !decodeBody(w, r, &req) {
		return
	}
	if err := c.SaveImplantProfile(req.Name, &req.Config, req.IsBeacon); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (s *Server) handleDeleteImplantProfile(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	if err := c.DeleteImplantProfile(r.PathValue("name")); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// --- SOCKS5 proxies ---

func (s *Server) handleSocksList(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"proxies": c.Socks().List()})
}

func (s *Server) handleSocksStart(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	var req struct {
		SessionID string `json:"session_id"`
		BindAddr  string `json:"bind_addr"`
		BindPort  uint32 `json:"bind_port"`
		Username  string `json:"username"`
		Password  string `json:"password"`
	}
	if !decodeBody(w, r, &req) {
		return
	}
	p, err := c.Socks().Start(req.SessionID, req.BindAddr, req.BindPort, req.Username, req.Password)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success":   true,
		"id":        p.ID,
		"bindAddr":  p.BindAddr,
		"bindPort":  p.BindPort,
	})
}

func (s *Server) handleSocksStop(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	id, err := strconv.ParseUint(r.PathValue("id"), 10, 64)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid proxy id")
		return
	}
	if err := c.Socks().Stop(id); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}
