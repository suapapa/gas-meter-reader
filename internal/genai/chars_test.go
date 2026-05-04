package genai

import "testing"

func TestContainsOnly(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		s       string
		allowed string
		want    bool
	}{
		{name: "empty string", s: "", allowed: "abc", want: true},
		{name: "all allowed", s: "123", allowed: ".?0123456789", want: true},
		{name: "disallowed rune", s: "12a", allowed: "0123456789", want: false},
		{name: "unicode single", s: "가", allowed: "가", want: true},
		{name: "unicode mismatch", s: "가", allowed: "나", want: false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			if got := ContainsOnly(tt.s, tt.allowed); got != tt.want {
				t.Fatalf("ContainsOnly(%q, %q) = %v, want %v", tt.s, tt.allowed, got, tt.want)
			}
		})
	}
}
