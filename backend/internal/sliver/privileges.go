package sliver

import (
	"context"
	"errors"
	"time"

	"github.com/bishopfox/sliver/protobuf/commonpb"
	"github.com/bishopfox/sliver/protobuf/sliverpb"
)

// WindowsPrivilegeView is the JSON shape of a Windows privilege entry.
type WindowsPrivilegeView struct {
	Name             string `json:"Name"`
	Description      string `json:"Description"`
	Enabled          bool   `json:"Enabled"`
	EnabledByDefault bool   `json:"EnabledByDefault"`
	Removed          bool   `json:"Removed"`
	UsedForAccess    bool   `json:"UsedForAccess"`
}

func privilegeToView(p *sliverpb.WindowsPrivilegeEntry) WindowsPrivilegeView {
	v := WindowsPrivilegeView{}
	if p == nil {
		return v
	}
	v.Name = p.Name
	v.Description = p.Description
	v.Enabled = p.Enabled
	v.EnabledByDefault = p.EnabledByDefault
	v.Removed = p.Removed
	v.UsedForAccess = p.UsedForAccess
	return v
}

// GetPrivs lists the privilege information of the session's process.
func (c *Client) GetPrivs(sessionID string) ([]WindowsPrivilegeView, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	resp, err := c.RPC.GetPrivs(ctx, &sliverpb.GetPrivsReq{
		Request: &commonpb.Request{SessionID: sessionID},
	})
	if err != nil {
		return nil, err
	}
	if resp.GetResponse().GetErr() != "" {
		return nil, errors.New(resp.GetResponse().GetErr())
	}
	out := make([]WindowsPrivilegeView, 0, len(resp.PrivInfo))
	for _, p := range resp.PrivInfo {
		out = append(out, privilegeToView(p))
	}
	return out, nil
}

// CurrentTokenOwner retrieves the owner of the session's thread token.
func (c *Client) CurrentTokenOwner(sessionID string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	resp, err := c.RPC.CurrentTokenOwner(ctx, &sliverpb.CurrentTokenOwnerReq{
		Request: &commonpb.Request{SessionID: sessionID},
	})
	if err != nil {
		return "", err
	}
	if resp.GetResponse().GetErr() != "" {
		return "", errors.New(resp.GetResponse().GetErr())
	}
	return resp.Output, nil
}

// ExecuteToken executes a program in the context of the session's token.
// Note: the ExecuteToken RPC was removed from sliver-server; use MakeToken +
// impersonation instead. Returns a clear error so the frontend surfaces it.
func (c *Client) ExecuteToken(sessionID, path string, args []string, output bool) (*ExecResult, error) {
	return nil, errors.New("ExecuteToken is not supported by the connected sliver-server version")
}

// RunAs runs a program as a specific user on the session.
func (c *Client) RunAs(sessionID, username, processName, args string) (string, bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	resp, err := c.RPC.RunAs(ctx, &sliverpb.RunAsReq{
		Username:    username,
		ProcessName: processName,
		Args:        args,
		Request:     &commonpb.Request{SessionID: sessionID},
	})
	if err != nil {
		return "", false, err
	}
	if resp.GetResponse().GetErr() != "" {
		return "", false, errors.New(resp.GetResponse().GetErr())
	}
	return resp.Output, resp.GetResponse().GetAsync(), nil
}
