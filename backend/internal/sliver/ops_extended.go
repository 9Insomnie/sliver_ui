package sliver

import (
	"context"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/bishopfox/sliver/protobuf/clientpb"
	"github.com/bishopfox/sliver/protobuf/commonpb"
	"github.com/bishopfox/sliver/protobuf/sliverpb"
)

// opTimeoutExt — extended operations use a longer timeout for assembly/DLL execution
const opTimeoutExt = 120 * time.Second

// --- ExecuteAssembly — .NET assembly in-memory execution ---
type ExecAssemblyResult struct {
	Output string `json:"output"`
}

func (c *Client) ExecuteAssembly(sessionID string, assembly []byte, arguments, process string) (*ExecAssemblyResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), opTimeoutExt)
	defer cancel()
	resp, err := c.RPC.ExecuteAssembly(ctx, &sliverpb.ExecuteAssemblyReq{
		Assembly:  assembly,
		Arguments: arguments,
		Process:   process,
		Request:   &commonpb.Request{SessionID: sessionID},
	})
	if err != nil {
		return nil, err
	}
	if resp.Response != nil && resp.Response.Err != "" {
		return nil, fmt.Errorf("%s", resp.Response.Err)
	}
	return &ExecAssemblyResult{Output: string(resp.Output)}, nil
}

// --- Sideload — DLL sideloading ---
type SideloadResult struct {
	Result string `json:"result"`
}

func (c *Client) Sideload(sessionID string, data []byte, processName, args, entryPoint string) (*SideloadResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), opTimeoutExt)
	defer cancel()
	resp, err := c.RPC.Sideload(ctx, &sliverpb.SideloadReq{
		Data:        data,
		ProcessName: processName,
		Args:        args,
		EntryPoint:  entryPoint,
		Request:     &commonpb.Request{SessionID: sessionID},
	})
	if err != nil {
		return nil, err
	}
	if resp.Response != nil && resp.Response.Err != "" {
		return nil, fmt.Errorf("%s", resp.Response.Err)
	}
	return &SideloadResult{Result: resp.Result}, nil
}

// --- SpawnDll — DLL injection ---
func (c *Client) SpawnDll(sessionID string, data []byte, processName, args, entryPoint string) (*SideloadResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), opTimeoutExt)
	defer cancel()
	resp, err := c.RPC.SpawnDll(ctx, &sliverpb.InvokeSpawnDllReq{
		Data:        data,
		ProcessName: processName,
		Args:        args,
		EntryPoint:  entryPoint,
		Request:     &commonpb.Request{SessionID: sessionID},
	})
	if err != nil {
		return nil, err
	}
	if resp.Response != nil && resp.Response.Err != "" {
		return nil, fmt.Errorf("%s", resp.Response.Err)
	}
	return &SideloadResult{Result: resp.Result}, nil
}

// --- Migrate — process migration ---
func (c *Client) Migrate(sessionID string, pid uint32) error {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	resp, err := c.RPC.Migrate(ctx, &clientpb.MigrateReq{
		Pid:     pid,
		Request: &commonpb.Request{SessionID: sessionID},
	})
	if err != nil {
		return err
	}
	if resp.Response != nil && resp.Response.Err != "" {
		return fmt.Errorf("%s", resp.Response.Err)
	}
	return nil
}

// --- ProcessDump — dump process memory ---
type ProcessDumpResult struct {
	Data string `json:"data"` // base64
}

func (c *Client) ProcessDump(sessionID string, pid int32) (*ProcessDumpResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), opTimeoutExt)
	defer cancel()
	resp, err := c.RPC.ProcessDump(ctx, &sliverpb.ProcessDumpReq{
		Pid:     pid,
		Request: &commonpb.Request{SessionID: sessionID},
	})
	if err != nil {
		return nil, err
	}
	if resp.Response != nil && resp.Response.Err != "" {
		return nil, fmt.Errorf("%s", resp.Response.Err)
	}
	return &ProcessDumpResult{Data: encodeBase64(resp.Data)}, nil
}

// --- Impersonate — impersonate a user ---
func (c *Client) Impersonate(sessionID, username string) error {
	ctx, cancel := context.WithTimeout(context.Background(), opTimeout)
	defer cancel()
	resp, err := c.RPC.Impersonate(ctx, &sliverpb.ImpersonateReq{
		Username: username,
		Request:  &commonpb.Request{SessionID: sessionID},
	})
	if err != nil {
		return err
	}
	if resp.Response != nil && resp.Response.Err != "" {
		return fmt.Errorf("%s", resp.Response.Err)
	}
	return nil
}

// --- MakeToken — create a token with credentials ---
func (c *Client) MakeToken(sessionID, username, password, domain string) error {
	ctx, cancel := context.WithTimeout(context.Background(), opTimeout)
	defer cancel()
	resp, err := c.RPC.MakeToken(ctx, &sliverpb.MakeTokenReq{
		Username: username,
		Password: password,
		Domain:   domain,
		Request:  &commonpb.Request{SessionID: sessionID},
	})
	if err != nil {
		return err
	}
	if resp.Response != nil && resp.Response.Err != "" {
		return fmt.Errorf("%s", resp.Response.Err)
	}
	return nil
}

// --- RevToSelf — revert impersonation ---
func (c *Client) RevToSelf(sessionID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), opTimeout)
	defer cancel()
	resp, err := c.RPC.RevToSelf(ctx, &sliverpb.RevToSelfReq{
		Request: &commonpb.Request{SessionID: sessionID},
	})
	if err != nil {
		return err
	}
	if resp.Response != nil && resp.Response.Err != "" {
		return fmt.Errorf("%s", resp.Response.Err)
	}
	return nil
}

// --- GetSystem — Windows SYSTEM escalation ---
func (c *Client) GetSystem(sessionID, hostingProcess string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	resp, err := c.RPC.GetSystem(ctx, &clientpb.GetSystemReq{
		HostingProcess: hostingProcess,
		Request:        &commonpb.Request{SessionID: sessionID},
	})
	if err != nil {
		return err
	}
	if resp.Response != nil && resp.Response.Err != "" {
		return fmt.Errorf("%s", resp.Response.Err)
	}
	return nil
}

// --- Ping — check session liveness ---
type PingResult struct {
	Nonce int32 `json:"nonce"`
}

func (c *Client) Ping(sessionID string) (*PingResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	resp, err := c.RPC.Ping(ctx, &sliverpb.Ping{
		Nonce:   int32(time.Now().UnixNano() & 0x7FFFFFFF),
		Request: &commonpb.Request{SessionID: sessionID},
	})
	if err != nil {
		return nil, err
	}
	if resp.Response != nil && resp.Response.Err != "" {
		return nil, fmt.Errorf("%s", resp.Response.Err)
	}
	return &PingResult{Nonce: resp.Nonce}, nil
}

// --- DeleteImplantBuild — delete a built implant ---
func (c *Client) DeleteImplantBuild(name string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	_, err := c.RPC.DeleteImplantBuild(ctx, &clientpb.DeleteReq{Name: name})
	return err
}

// --- Regenerate — rebuild an implant without changing config ---
type RegenerateResult struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Name    string `json:"name"`
	Data    string `json:"data"`
}

func (c *Client) Regenerate(implantName string) (*RegenerateResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	resp, err := c.RPC.Regenerate(ctx, &clientpb.RegenerateReq{ImplantName: implantName})
	if err != nil {
		return nil, err
	}
	var data string
	if resp.File != nil {
		data = base64.StdEncoding.EncodeToString(resp.File.Data)
	}
	return &RegenerateResult{
		Success: true,
		Message: fmt.Sprintf("regenerated %s", implantName),
		Name:    resp.File.Name,
		Data:    data,
	}, nil
}

// --- GetOperators — list multiplayer operators ---
type OperatorView struct {
	Name   string `json:"name"`
	Online bool   `json:"online"`
}

func (c *Client) GetOperators() ([]OperatorView, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	resp, err := c.RPC.GetOperators(ctx, &commonpb.Empty{})
	if err != nil {
		return nil, err
	}
	out := make([]OperatorView, 0, len(resp.Operators))
	for _, op := range resp.Operators {
		out = append(out, OperatorView{Name: op.Name, Online: op.Online})
	}
	return out, nil
}

// --- RegistryCreateKey — create a new registry key ---
func (c *Client) RegistryCreateKey(sessionID, hive, path, key string) error {
	ctx, cancel := context.WithTimeout(context.Background(), opTimeout)
	defer cancel()
	resp, err := c.RPC.RegistryCreateKey(ctx, &sliverpb.RegistryCreateKeyReq{
		Hive:    hive,
		Path:    path,
		Key:     key,
		Request: &commonpb.Request{SessionID: sessionID},
	})
	if err != nil {
		return err
	}
	if resp.Response != nil && resp.Response.Err != "" {
		return fmt.Errorf("%s", resp.Response.Err)
	}
	return nil
}
