//go:build windows
// +build windows

package main

import (
	"log"
	"os"

	"github.com/jchv/go-webview2"
)

// runWindow opens a native WebView2 window that renders the web UI. It blocks
// until the window is closed, then the process exits.
func runWindow(url string) {
	// Use pure CPU rendering (--disable-gpu): hardware acceleration can flicker
	// on machines without stable GPU support (e.g. low-memory VMs), and the
	// SwiftShader fallback keeps the compositor surface stale while scrolling.
	// Extra browser args are appended for debugging (e.g. a CDP port).
	args := "--disable-gpu"
	if extra := os.Getenv("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS"); extra != "" {
		args += " " + extra
	}
	_ = os.Setenv("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", args)

	w := webview2.NewWithOptions(webview2.WebViewOptions{
		// AutoFocus makes the WebView child take focus when the window is
		// activated, otherwise mouse-wheel scrolling can silently do nothing.
		AutoFocus: true,
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
