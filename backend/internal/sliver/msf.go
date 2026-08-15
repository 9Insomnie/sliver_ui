package sliver

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/bishopfox/sliver/protobuf/clientpb"
	"github.com/bishopfox/sliver/protobuf/commonpb"
)

// Msf generates an MSF payload and executes it on the session.
func (c *Client) Msf(sessionID, payload, lhost string, lport uint32, encoder string, iterations int32) error {
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	resp, err := c.RPC.Msf(ctx, &clientpb.MSFReq{
		Payload:    payload,
		LHost:      lhost,
		LPort:      lport,
		Encoder:    encoder,
		Iterations: iterations,
		Request:    &commonpb.Request{SessionID: sessionID},
	})
	if err != nil {
		return err
	}
	if resp.GetResponse().GetErr() != "" {
		return errors.New(resp.GetResponse().GetErr())
	}
	return nil
}

// MsfRemote injects an MSF payload into a remote process on the session.
func (c *Client) MsfRemote(sessionID, payload, lhost string, lport uint32, encoder string, iterations int32, pid uint32) error {
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	resp, err := c.RPC.MsfRemote(ctx, &clientpb.MSFRemoteReq{
		Payload:    payload,
		LHost:      lhost,
		LPort:      lport,
		Encoder:    encoder,
		Iterations: iterations,
		PID:        pid,
		Request:    &commonpb.Request{SessionID: sessionID},
	})
	if err != nil {
		return err
	}
	if resp.GetResponse().GetErr() != "" {
		return errors.New(resp.GetResponse().GetErr())
	}
	return nil
}

// MsfStagerView is the JSON shape of a generated MSF stager.
type MsfStagerView struct {
	FileName string `json:"FileName"`
	DataB64  string `json:"DataB64"`
	Size     int    `json:"Size"`
}

// MsfStage generates an MSF stager (no session required).
func (c *Client) MsfStage(arch, format string, port uint32, host, osName, protocol string, badChars []string) (*MsfStagerView, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	stageProtocol, err := stageProtocolFromString(protocol)
	if err != nil {
		return nil, err
	}
	resp, err := c.RPC.MsfStage(ctx, &clientpb.MsfStagerReq{
		Arch:     arch,
		Format:   format,
		Port:     port,
		Host:     host,
		OS:       osName,
		Protocol: stageProtocol,
		BadChars: badChars,
	})
	if err != nil {
		return nil, err
	}
	file := resp.GetFile()
	if file == nil {
		return nil, errors.New("empty stager response")
	}
	return &MsfStagerView{
		FileName: file.Name,
		DataB64:  encodeBase64(file.Data),
		Size:     len(file.Data),
	}, nil
}

func stageProtocolFromString(s string) (clientpb.StageProtocol, error) {
	switch strings.ToLower(s) {
	case "", "tcp":
		return clientpb.StageProtocol_TCP, nil
	case "http":
		return clientpb.StageProtocol_HTTP, nil
	case "https":
		return clientpb.StageProtocol_HTTPS, nil
	default:
		return clientpb.StageProtocol_TCP, errors.New("protocol must be tcp, http or https")
	}
}
