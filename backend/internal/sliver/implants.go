package sliver

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/bishopfox/sliver/protobuf/clientpb"
	"github.com/bishopfox/sliver/protobuf/commonpb"
	"github.com/bishopfox/sliver/protobuf/sliverpb"
)

// GenerateRequest is the JSON body for implant generation.
type GenerateRequest struct {
	Name        string `json:"name"`
	OS          string `json:"os"`
	Arch        string `json:"arch"`
	Format      string `json:"format"`
	C2          []struct {
		Address  string `json:"address"`
		Protocol string `json:"protocol"`
	} `json:"c2"`
	Interval  int64 `json:"interval"`
	Jitter    int64 `json:"jitter"`
	MaxErrors int32 `json:"maxConnectionErrors"`
	Debug     bool  `json:"debug"`
	Evasion   bool  `json:"evasion"`
	Obfuscate bool  `json:"obfuscate"`
}

// ImplantConfigView mirrors the relevant fields of clientpb.ImplantConfig.
type ImplantConfigView struct {
	Name        string `json:"Name"`
	OS          string `json:"OS"`
	Arch        string `json:"Arch"`
	Format      string `json:"Format"`
	Interval    int64  `json:"Interval"`
	Jitter      int64  `json:"Jitter"`
	Obfuscate   bool   `json:"Obfuscate"`
	Debug       bool   `json:"Debug"`
	Evasion     bool   `json:"Evasion"`
	MaxErrors   uint32 `json:"MaxConnectionErrors"`
	IsBeacon    bool   `json:"IsBeacon"`
	BeaconInt   int64  `json:"BeaconInterval"`
	BeaconJit   int64  `json:"BeaconJitter"`
	C2          []struct {
		URL string `json:"URL"`
	} `json:"C2"`
}

// ImplantBuildView is the JSON shape for a stored implant build.
type ImplantBuildView struct {
	Name          string             `json:"Name"`
	ImplantConfig *ImplantConfigView `json:"ImplantConfig"`
	OS            string             `json:"OS"`
	Arch          string             `json:"Arch"`
}

func configToView(c *clientpb.ImplantConfig) *ImplantConfigView {
	if c == nil {
		return nil
	}
	// C2 list — start from nil, append actual URLs only
	var c2 []struct {
		URL string `json:"URL"`
	}
	for _, u := range c.C2 {
		if u == nil {
			continue
		}
		c2 = append(c2, struct {
			URL string `json:"URL"`
		}{URL: u.URL})
	}
	return &ImplantConfigView{
		Name:        c.Name,
		OS:          c.GOOS,
		Arch:        c.GOARCH,
		Format:      c.Format.String(),
		Interval:    c.BeaconInterval,
		Jitter:      c.BeaconJitter,
		Obfuscate:   c.ObfuscateSymbols,
		Debug:       c.Debug,
		Evasion:     c.Evasion,
		MaxErrors:   c.MaxConnectionErrors,
		IsBeacon:    c.IsBeacon,
		BeaconInt:   c.BeaconInterval,
		BeaconJit:   c.BeaconJitter,
		C2:          c2,
	}
}

// ImplantBuilds lists stored implant builds.
func (c *Client) ImplantBuilds() ([]ImplantBuildView, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	resp, err := c.RPC.ImplantBuilds(ctx, &commonpb.Empty{})
	if err != nil {
		return nil, err
	}
	out := make([]ImplantBuildView, 0, len(resp.Configs))
	for name, cfg := range resp.Configs {
		if cfg == nil {
			continue
		}
		out = append(out, ImplantBuildView{
			Name:          name,
			ImplantConfig: configToView(cfg),
			OS:            cfg.GOOS,
			Arch:          cfg.GOARCH,
		})
	}
	return out, nil
}

func buildC2URL(address, protocol string) string {
	url := address
	if !strings.Contains(url, "://") {
		if protocol == "" {
			protocol = "mtls"
		}
		switch protocol {
		case "mtls":
			url = "mtls://" + url
		case "http":
			url = "http://" + url
		case "https":
			url = "https://" + url
		case "dns":
			url = "dns://" + url
		case "wireguard":
			url = "wg://" + url
		default:
			url = "mtls://" + url
		}
	}
	return url
}

// ImplantProfileView is the JSON shape of an implant profile.
type ImplantProfileView struct {
	Name   string             `json:"Name"`
	Config *ImplantConfigView `json:"Config"`
}

// ImplantProfiles lists saved implant profiles.
func (c *Client) ImplantProfiles() ([]ImplantProfileView, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	resp, err := c.RPC.ImplantProfiles(ctx, &commonpb.Empty{})
	if err != nil {
		return nil, err
	}
	out := make([]ImplantProfileView, 0, len(resp.Profiles))
	for _, p := range resp.Profiles {
		if p == nil {
			continue
		}
		out = append(out, ImplantProfileView{Name: p.Name, Config: configToView(p.Config)})
	}
	return out, nil
}

// SaveImplantProfile saves (or updates) an implant profile.
func (c *Client) SaveImplantProfile(name string, req *GenerateRequest, isBeacon bool) error {
	if name == "" {
		return fmt.Errorf("profile name is required")
	}
	cfg := buildImplantConfig(req, isBeacon)
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	_, err := c.RPC.SaveImplantProfile(ctx, &clientpb.ImplantProfile{Name: name, Config: cfg})
	return err
}

// DeleteImplantProfile removes a saved implant profile.
func (c *Client) DeleteImplantProfile(name string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	_, err := c.RPC.DeleteImplantProfile(ctx, &clientpb.DeleteReq{Name: name})
	return err
}

// buildImplantConfig converts a GenerateRequest into a clientpb.ImplantConfig.
func buildImplantConfig(req *GenerateRequest, isBeacon bool) *clientpb.ImplantConfig {
	if req.OS == "" {
		req.OS = "windows"
	}
	if req.Arch == "" {
		req.Arch = "amd64"
	}
	if req.Interval == 0 {
		req.Interval = 60
	}

	format := clientpb.OutputFormat_EXECUTABLE
	switch strings.ToLower(req.Format) {
	case "service":
		format = clientpb.OutputFormat_SERVICE
	case "shellcode":
		format = clientpb.OutputFormat_SHELLCODE
	case "shared":
		format = clientpb.OutputFormat_SHARED_LIB
	}

	cfg := &clientpb.ImplantConfig{
		Name:             req.Name,
		GOOS:             req.OS,
		GOARCH:           req.Arch,
		Format:           format,
		Debug:            req.Debug,
		Evasion:          req.Evasion,
		ObfuscateSymbols: req.Obfuscate,
		IsBeacon:         isBeacon,
		BeaconInterval:   req.Interval,
		BeaconJitter:     req.Jitter,
	}
	if req.MaxErrors != 0 {
		cfg.MaxConnectionErrors = uint32(req.MaxErrors)
	} else {
		cfg.MaxConnectionErrors = 1000
	}

	for _, c2 := range req.C2 {
		if c2.Address == "" {
			continue
		}
		cfg.C2 = append(cfg.C2, &clientpb.ImplantC2{URL: buildC2URL(c2.Address, c2.Protocol)})
	}
	if len(cfg.C2) == 0 {
		cfg.C2 = append(cfg.C2, &clientpb.ImplantC2{URL: "mtls://127.0.0.1:8888"})
	}
	return cfg
}

// GenerateImplant generates and compiles an implant.
func (c *Client) GenerateImplant(req *GenerateRequest) (map[string]any, error) {
	if req.Name == "" {
		return nil, fmt.Errorf("implant name is required")
	}
	cfg := buildImplantConfig(req, false)

	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	resp, err := c.RPC.Generate(ctx, &clientpb.GenerateReq{Config: cfg})
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"success": true,
		"message": fmt.Sprintf("built %s (%s/%s)", resp.File.Name, req.OS, req.Arch),
		"name":    resp.File.Name,
	}, nil
}

// KillSession sends a kill command to the implant.
// Sliver v1.15.16 没有 KillSession RPC 方法 — 服务端在 implant
// 断开后自动清理 session 记录，无需显式调用。
func (c *Client) KillSession(id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	_, err := c.RPC.Kill(ctx, &sliverpb.KillReq{
		Force: true,
		Request: &commonpb.Request{
			SessionID: id,
		},
	})
	return err
}
