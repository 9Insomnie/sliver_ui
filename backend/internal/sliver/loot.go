package sliver

import (
	"context"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/bishopfox/sliver/protobuf/clientpb"
	"github.com/bishopfox/sliver/protobuf/commonpb"
)

// LootView is the JSON shape of a loot entry.
type LootView struct {
	ID           string `json:"ID"`
	Name         string `json:"Name"`
	LootType     string `json:"LootType"`
	FileType     string `json:"FileType"`
	File         string `json:"File"`
	Size         int64  `json:"Size"`
	DataB64      string `json:"DataB64,omitempty"`
	CredUser     string `json:"CredUser,omitempty"`
	CredPassword string `json:"CredPassword,omitempty"`
	CredAPIKey   string `json:"CredAPIKey,omitempty"`
}

func lootToView(l *clientpb.Loot, withData bool) *LootView {
	if l == nil {
		return nil
	}
	v := &LootView{
		ID:       l.LootID,
		Name:     l.Name,
		LootType: l.Type.String(),
		FileType: l.FileType.String(),
	}
	if l.File != nil {
		v.File = l.File.Name
		v.Size = int64(len(l.File.Data))
	}
	if l.Credential != nil {
		v.CredUser = l.Credential.User
		v.CredPassword = l.Credential.Password
		v.CredAPIKey = l.Credential.APIKey
	}
	if withData {
		if l.File != nil {
			v.DataB64 = encodeBase64(l.File.Data)
		}
	}
	return v
}

// LootAll lists all loot stored on the server.
func (c *Client) LootAll() ([]LootView, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	resp, err := c.RPC.LootAll(ctx, &commonpb.Empty{})
	if err != nil {
		return nil, err
	}
	return lootListToViews(resp.GetLoot(), false), nil
}

// LootAllOf lists loot filtered by type ("file" or "credential").
func (c *Client) LootAllOf(kind string) ([]LootView, error) {
	lootType := clientpb.LootType_LOOT_FILE
	if strings.EqualFold(kind, "credential") {
		lootType = clientpb.LootType_LOOT_CREDENTIAL
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	resp, err := c.RPC.LootAllOf(ctx, &clientpb.Loot{Type: lootType})
	if err != nil {
		return nil, err
	}
	return lootListToViews(resp.GetLoot(), false), nil
}

func lootListToViews(items []*clientpb.Loot, withData bool) []LootView {
	out := make([]LootView, 0, len(items))
	for _, l := range items {
		if l == nil {
			continue
		}
		if v := lootToView(l, withData); v != nil {
			out = append(out, *v)
		}
	}
	return out
}

// LootContent fetches the full data of a loot entry.
func (c *Client) LootContent(id string) (*LootView, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	resp, err := c.RPC.LootContent(ctx, &clientpb.Loot{LootID: id})
	if err != nil {
		return nil, err
	}
	return lootToView(resp, true), nil
}

// LootRemove deletes a loot entry from the server.
func (c *Client) LootRemove(id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	_, err := c.RPC.LootRm(ctx, &clientpb.Loot{LootID: id})
	return err
}

// LootAddRequest is the JSON body for adding a loot entry.
type LootAddRequest struct {
	Type         string `json:"type"`          // "file" (default) | "credential"
	Name         string `json:"name"`
	FileName     string `json:"file_name"`
	FileType     string `json:"file_type"` // "text" | "binary"
	FileDataB64  string `json:"file_data_b64"`
	CredUser     string `json:"cred_user"`
	CredPassword string `json:"cred_password"`
	CredAPIKey   string `json:"cred_api_key"`
}

// LootAdd stores a new loot entry (file or credential) on the server.
func (c *Client) LootAdd(req *LootAddRequest) (string, error) {
	loot := &clientpb.Loot{Name: req.Name}
	switch strings.ToLower(req.Type) {
	case "credential":
		loot.Type = clientpb.LootType_LOOT_CREDENTIAL
		cred := &clientpb.Credential{}
		if req.CredAPIKey != "" {
			loot.CredentialType = clientpb.CredentialType_API_KEY
			cred.APIKey = req.CredAPIKey
		} else {
			loot.CredentialType = clientpb.CredentialType_USER_PASSWORD
			cred.User = req.CredUser
			cred.Password = req.CredPassword
		}
		loot.Credential = cred
	default:
		loot.Type = clientpb.LootType_LOOT_FILE
		data, err := base64.StdEncoding.DecodeString(req.FileDataB64)
		if err != nil {
			return "", fmt.Errorf("invalid file data: %w", err)
		}
		if strings.EqualFold(req.FileType, "text") {
			loot.FileType = clientpb.FileType_TEXT
		} else {
			loot.FileType = clientpb.FileType_BINARY
		}
		loot.File = &commonpb.File{Name: req.FileName, Data: data}
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	resp, err := c.RPC.LootAdd(ctx, loot)
	if err != nil {
		return "", err
	}
	return resp.GetLootID(), nil
}

// LootRename updates the name of a loot entry (the only mutable field).
func (c *Client) LootRename(id, name string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	_, err := c.RPC.LootUpdate(ctx, &clientpb.Loot{LootID: id, Name: name})
	return err
}
