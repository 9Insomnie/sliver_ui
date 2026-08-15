//go:build windows
// +build windows

package main

import (
	"log"

	"github.com/jchv/go-webview2"
)

// runWindow opens a native WebView2 window that renders the web UI. It blocks
// until the window is closed, then the process exits.
func runWindow(url string) {
	w := webview2.NewWithOptions(webview2.WebViewOptions{
		WindowOptions: webview2.WindowOptions{
			Title:  "Sliver UI",
			Width:  1440,
			Height: 900,
			Center: true,
		},
	})
	if w == nil {
		log.Fatal("[ui] failed to create webview window")
	}
	defer w.Destroy()
	w.Navigate(url)
	w.Run()
}
