//go:build !windows
// +build !windows

package main

import "log"

// runWindow is only implemented for Windows (native WebView2). On other
// platforms the HTTP server keeps running and the UI is reachable via URL.
func runWindow(url string) {
	log.Printf("[ui] desktop window is only supported on Windows; serving at %s", url)
	select {}
}
