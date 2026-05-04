package openaicompat

import (
	"strings"
	"testing"
)

func TestExtractJSONObject(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		in   string
		want string
	}{
		{name: "plain object", in: `{"read":"1.23","date":"x"}`, want: `{"read":"1.23","date":"x"}`},
		{name: "prefixed text", in: `Here: {"read":"1"}`, want: `{"read":"1"}`},
		{name: "markdown fence", in: "```json\n{\"a\":1}\n```", want: `{"a":1}`},
		{name: "no object", in: "no brace", want: ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			got := extractJSONObject(tt.in)
			if got != tt.want {
				t.Fatalf("extractJSONObject() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestParseGasMeterJSON(t *testing.T) {
	t.Parallel()

	valid := `{"read":"123.4","date":"2024-01-01"}`
	res, err := parseGasMeterJSON(valid)
	if err != nil {
		t.Fatalf("parseGasMeterJSON: %v", err)
	}
	if res.Read != "123.4" || res.Date != "2024-01-01" {
		t.Fatalf("result = %#v", res)
	}

	_, err = parseGasMeterJSON("no json")
	if err == nil {
		t.Fatal("expected error for no json")
	}
}

func TestStripMarkdownFence(t *testing.T) {
	t.Parallel()

	in := "```json\n" + strings.TrimSpace(`{"x":1}`) + "\n```"
	got := stripMarkdownFence(in)
	if !strings.Contains(got, "{") {
		t.Fatalf("stripMarkdownFence: %q", got)
	}
}
