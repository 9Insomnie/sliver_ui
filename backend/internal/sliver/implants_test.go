package sliver

import (
	"testing"
)

func TestBuildC2URL_WithScheme(t *testing.T) {
	cases := []struct {
		addr string
		want string
	}{
		{"mtls://1.2.3.4:8888", "mtls://1.2.3.4:8888"},
		{"https://example.com", "https://example.com"},
		{"dns://dns.example.com", "dns://dns.example.com"},
	}
	for _, tc := range cases {
		if got := buildC2URL(tc.addr, ""); got != tc.want {
			t.Errorf("buildC2URL(%q) = %q, want %q", tc.addr, got, tc.want)
		}
	}
}

func TestBuildC2URL_WithoutScheme(t *testing.T) {
	cases := []struct {
		addr     string
		protocol string
		want     string
	}{
		{"1.2.3.4:8888", "mtls", "mtls://1.2.3.4:8888"},
		{"example.com:443", "https", "https://example.com:443"},
		{"1.2.3.4:80", "http", "http://1.2.3.4:80"},
		{"dns.example.com", "dns", "dns://dns.example.com"},
		{"1.2.3.4", "wireguard", "wg://1.2.3.4"},
		{"1.2.3.4:8888", "", "mtls://1.2.3.4:8888"},
		{"1.2.3.4:8888", "unknown", "mtls://1.2.3.4:8888"},
	}
	for _, tc := range cases {
		if got := buildC2URL(tc.addr, tc.protocol); got != tc.want {
			t.Errorf("buildC2URL(%q, %q) = %q, want %q", tc.addr, tc.protocol, got, tc.want)
		}
	}
}
