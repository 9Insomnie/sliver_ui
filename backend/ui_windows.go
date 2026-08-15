//go:build windows
// +build windows

package main

import (
	"log"
	"os"
	"syscall"
	"unsafe"

	"github.com/jchv/go-webview2"
)

var (
	user32 = syscall.NewLazyDLL("user32.dll")

	procSetProcessDpiAwarenessContext = user32.NewProc("SetProcessDpiAwarenessContext")
	procSystemParametersInfoW         = user32.NewProc("SystemParametersInfoW")

	// DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 is a HANDLE value of -4.
	dpiAwarenessPerMonitorV2 = ^uintptr(3)

	spiGetWorkArea = uintptr(0x0030)
)

// rect mirrors the Win32 RECT structure.
type rect struct {
	left, top, right, bottom int32
}

func init() {
	// Declare per-monitor DPI awareness so the window is sized and rendered in
	// physical pixels. Without it Windows virtualizes coordinates and the
	// fixed 1440x900 window overflows the screen at >100% display scaling,
	// clipping the card layout.
	r, _, _ := procSetProcessDpiAwarenessContext.Call(dpiAwarenessPerMonitorV2)
	if r == 0 {
		// Windows 8.1 and earlier: fall back to system DPI aware.
		_, _, _ = user32.NewProc("SetProcessDPIAware").Call()
	}
}

// windowSize returns the initial window size, clamped to the primary monitor
// work area so the UI is never clipped on small screens or scaled displays.
func windowSize() (uint, uint) {
	const (
		desiredW = 1440
		desiredH = 900
	)
	var wa rect
	r, _, _ := procSystemParametersInfoW.Call(spiGetWorkArea, 0, uintptr(unsafe.Pointer(&wa)), 0)
	if r == 0 || wa.right <= wa.left || wa.bottom <= wa.top {
		return desiredW, desiredH
	}
	return uint(min(desiredW, int(wa.right-wa.left))), uint(min(desiredH, int(wa.bottom-wa.top)))
}

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

	width, height := windowSize()

	w := webview2.NewWithOptions(webview2.WebViewOptions{
		// AutoFocus makes the WebView child take focus when the window is
		// activated, otherwise mouse-wheel scrolling can silently do nothing.
		AutoFocus: true,
		WindowOptions: webview2.WindowOptions{
			Title:  "Sliver UI",
			Width:  width,
			Height: height,
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
