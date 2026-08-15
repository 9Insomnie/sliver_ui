package sliver

import (
	"context"
	"time"

	"github.com/bishopfox/sliver/protobuf/clientpb"
	"github.com/bishopfox/sliver/protobuf/commonpb"
)

// LootView is the JSON shape of a loot entry.
type LootView struct {
	ID            string `json:"ID"`
	Name          string `json:"Name"`
	LootType      string `json:"LootType"`
	FileType      string `json:"FileType"`
	File          string `json:"File"`
	Size          int64  `json:"Size"`
	OriginHostUUID string `json:"OriginHostUUID"`
	DataB64       string `json:"DataB64,omitempty"`
}

func lootToView(l *clientpb.Loot, withData bool) *LootView {
	if l == nil {
		return nil
	}
	v := &LootView{
		ID:             l.ID,
		Name:           l.Name,
		LootType:       l.LootType.String(),
		FileType:       l.FileType.String(),
		File:           l.File,
		Size:           l.Size,
		OriginHostUUID: l.OriginHostUUID,
	}
	if withData {
		v.DataB64 = encodeBase64(l.Data)
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
	out := make([]LootView, 0, len(resp.Loot))
	for _, l := range resp.Loot {
		if l == nil {
			continue
		}
		if v := lootToView(l, false); v != nil {
			out = append(out, *v)
		}
	}
	return out, nil
}

// LootContent fetches the full data of a loot entry.
func (c *Client) LootContent(id string) (*LootView, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	resp, err := c.RPC.LootContent(ctx, &clientpb.Loot{ID: id})
	if err != nil {
		return nil, err
	}
	return lootToView(resp, true), nil
}

// LootRemove deletes a loot entry from the server.
func (c *Client) LootRemove(id string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	_, err := c.RPC.LootRemove(ctx, &clientpb.Loot{ID: id})
	return err
}
