package main

import (
	"flag"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"time"

	"sliverui/internal/api"
)

func main() {
	initLog()
	addr := flag.String("addr", "0.0.0.0:8080", "listen address for the API server")
	profile := flag.String("profile", "", "sliver-client profile to connect to on startup (optional)")
	noWindow := flag.Bool("no-window", false, "run as a plain HTTP server without opening the desktop UI window")
	noBrowser := flag.Bool("no-browser", false, "do not open the web UI in the default browser (server mode only)")
	flag.Parse()

	srv := api.New()

	if *profile != "" {
		if client, err := connectProfile(*profile); err != nil {
			log.Printf("[startup] failed to connect profile %q: %v", *profile, err)
		} else {
			srv.SetClient(client)
			log.Printf("[startup] connected to sliver-server using profile %q", *profile)
		}
	}

	url, err := uiURL(*addr)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("Sliver UI API listening on %s", *addr)
	go func() {
		if err := http.ListenAndServe(*addr, srv.Routes()); err != nil {
			log.Fatal(err)
		}
	}()

	if *noWindow {
		if !*noBrowser {
			openBrowserSoon(url)
		}
		select {}
	}

	// Desktop mode: show the embedded frontend in a native window. The window
	// event loop blocks until it is closed, then the process exits.
	// On non-Windows platforms there is no native window, so the default
	// browser is opened automatically instead.
	if runtime.GOOS != "windows" && !*noBrowser {
		openBrowserSoon(url)
	}
	time.Sleep(400 * time.Millisecond)
	runWindow(url)
}

// initLog mirrors the console log into sliver-ui.log so errors remain
// debuggable when the app runs as a GUI-subsystem binary (no console window).
func initLog() {
	f, err := os.OpenFile("sliver-ui.log", os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		return
	}
	log.SetOutput(fanoutWriter{ws: []io.Writer{os.Stderr, f}})
}

// fanoutWriter writes to every underlying writer and ignores errors from the
// console stream, which is invalid in GUI-subsystem builds.
type fanoutWriter struct {
	ws []io.Writer
}

func (w fanoutWriter) Write(p []byte) (int, error) {
	for _, s := range w.ws {
		_, _ = s.Write(p)
	}
	return len(p), nil
}

// uiURL derives the browser-facing URL from the listen address, mapping
// wildcard hosts to localhost.
func uiURL(addr string) (string, error) {
	host, port, err := net.SplitHostPort(addr)
	if err != nil {
		return "", fmt.Errorf("invalid addr %q: %w", addr, err)
	}
	if port == "" {
		return "", fmt.Errorf("invalid addr %q: missing port", addr)
	}
	if host == "0.0.0.0" || host == "::" || host == "" {
		host = "localhost"
	}
	return "http://" + host + ":" + port + "/", nil
}

// openBrowserSoon opens the web UI in the default browser once the server is up.
func openBrowserSoon(url string) {
	go func() {
		time.Sleep(400 * time.Millisecond)
		if err := openBrowser(url); err != nil {
			log.Printf("[browser] failed to open browser: %v", err)
			return
		}
		log.Printf("[browser] opened %s", url)
	}()
}

// openBrowser launches the OS default browser. No external dependencies.
func openBrowser(url string) error {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	return cmd.Start()
}
