package api

import (
	"encoding/binary"
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"golang.org/x/net/websocket"

	"sliverui/internal/sliver"
)

const (
	wsMsgData   = uint8(0x01)
	wsMsgResize = uint8(0x02)
	wsMsgClose  = uint8(0x03)
)

// handleTerminalWS upgrades the HTTP connection to a WebSocket and bridges it
// to an interactive Sliver shell tunnel.
//
// Wire format (both directions):
//
//	[1 byte msgType][4 byte length][payload]
//
// Client -> server:
//
//	0x01: raw terminal bytes
//	0x02: JSON {"cols":N,"rows":N} (resize; acked but not forwarded to PTY)
//
// Server -> client:
//
//	0x01: raw terminal bytes
//	0x03: tunnel closed
func (s *Server) handleTerminalWS(w http.ResponseWriter, r *http.Request) {
	c := s.requireClient(w)
	if c == nil {
		return
	}
	rest := strings.TrimPrefix(r.URL.Path, "/ws/sessions/")
	rest = strings.TrimSuffix(rest, "/terminal")
	id := rest

	websocket.Server{Handler: func(ws *websocket.Conn) {
		s.runTerminal(ws, c, id)
	}}.ServeHTTP(w, r)
}

func (s *Server) runTerminal(ws *websocket.Conn, c *sliver.Client, sessionID string) {
	defer ws.Close()

	tm, err := sliver.NewTunnelManager(c)
	if err != nil {
		_ = writeWS(ws, wsMsgClose, []byte("failed to open tunnel stream: "+err.Error()))
		return
	}
	defer tm.Close()

	// Only enable PTY for unix-like sessions.
	enablePTY := false
	if sessions, err := c.Sessions(); err == nil {
		for _, s := range sessions {
			if s.ID == sessionID && (s.OS == "linux" || s.OS == "darwin") {
				enablePTY = true
				break
			}
		}
	}

	tunnel, err := tm.StartShell(sessionID, enablePTY)
	if err != nil {
		_ = writeWS(ws, wsMsgClose, []byte("failed to start shell: "+err.Error()))
		return
	}

	// Tunnel -> WS: forward implant output to the browser.
	go func() {
		buf := make([]byte, 8192)
		for {
			n, err := tunnel.Read(buf)
			if n > 0 {
				if werr := writeWS(ws, wsMsgData, buf[:n]); werr != nil {
					return
				}
			}
			if err != nil {
				_ = writeWS(ws, wsMsgClose, []byte{})
				return
			}
		}
	}()

	// WS -> tunnel: forward browser keystrokes to the implant.
	frame := make([]byte, 8192)
	for {
		n, err := ws.Read(frame)
		if err != nil {
			if err != io.EOF {
				tunnel.Write([]byte("exit\n"))
			}
			return
		}
		if n < 5 {
			continue
		}
		msgType := frame[0]
		payload := frame[5:n]
		switch msgType {
		case wsMsgResize:
			var dims struct {
				Cols int `json:"cols"`
				Rows int `json:"rows"`
			}
			_ = json.Unmarshal(payload, &dims)
		case wsMsgData:
			if len(payload) > 0 {
				_, _ = tunnel.Write(payload)
			}
		}
	}
}

// writeWS frames a WebSocket message: [type][4-byte BE length][payload].
func writeWS(ws *websocket.Conn, msgType uint8, payload []byte) error {
	frame := make([]byte, 1+4+len(payload))
	frame[0] = msgType
	binary.BigEndian.PutUint32(frame[1:5], uint32(len(payload)))
	copy(frame[5:], payload)
	_, err := ws.Write(frame)
	return err
}
