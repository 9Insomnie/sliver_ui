package main

import (
	"sliverui/internal/sliver"
)

func connectProfile(name string) (*sliver.Client, error) {
	cfg, err := sliver.LoadProfile(name)
	if err != nil {
		return nil, err
	}
	return sliver.Connect(cfg)
}
