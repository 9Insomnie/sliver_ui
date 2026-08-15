package main

import (
	"flag"
	"log"
	"net/http"

	"sliverui/internal/api"
)

func main() {
	addr := flag.String("addr", "0.0.0.0:8080", "listen address for the API server")
	profile := flag.String("profile", "", "sliver-client profile to connect to on startup (optional)")
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

	log.Printf("Sliver UI API listening on %s", *addr)
	if err := http.ListenAndServe(*addr, srv.Routes()); err != nil {
		log.Fatal(err)
	}
}
