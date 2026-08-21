package openaicompat

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
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

func TestChatCompletionStream(t *testing.T) {
	t.Parallel()

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req chatCompletionRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Errorf("decode request: %v", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if !req.Stream {
			t.Errorf("expected stream=true")
		}
		if _, ok := r.Header["X-Bf-Mcp-Include-Tools"]; !ok {
			t.Errorf("expected X-Bf-Mcp-Include-Tools header to be present")
		}

		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(http.StatusOK)
		flusher, _ := w.(http.Flusher)

		chunks := []string{`{"read":"0292`, `5.457","date":"2024-01-01"}`}
		for _, part := range chunks {
			payload, _ := json.Marshal(map[string]any{
				"choices": []map[string]any{
					{"delta": map[string]string{"content": part}},
				},
			})
			fmt.Fprintf(w, "data: %s\n\n", payload)
			if flusher != nil {
				flusher.Flush()
			}
		}
		fmt.Fprintf(w, "data: [DONE]\n\n")
		if flusher != nil {
			flusher.Flush()
		}
	}))
	defer ts.Close()

	c := NewClient(ts.URL, "key", "test-model", "sys", "user", "fixSys", "fixUser", time.Second)
	got, err := c.chatCompletion(context.Background(), []chatMessage{
		{Role: "user", Content: "hi"},
	}, 0.1)
	if err != nil {
		t.Fatalf("chatCompletion: %v", err)
	}
	want := `{"read":"02925.457","date":"2024-01-01"}`
	if got != want {
		t.Fatalf("got %q, want %q", got, want)
	}
}

func TestChatCompletionIdleTimeout(t *testing.T) {
	t.Parallel()

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(http.StatusOK)
		if flusher, ok := w.(http.Flusher); ok {
			flusher.Flush()
		}
		time.Sleep(300 * time.Millisecond)
	}))
	defer ts.Close()

	c := NewClient(ts.URL, "key", "test-model", "sys", "user", "fixSys", "fixUser", 50*time.Millisecond)
	_, err := c.chatCompletion(context.Background(), []chatMessage{
		{Role: "user", Content: "hi"},
	}, 0.1)
	if err == nil {
		t.Fatal("expected timeout error, got nil")
	}
	if !strings.Contains(err.Error(), "stream timeout") {
		t.Fatalf("expected stream timeout error, got %q", err.Error())
	}
}

func TestChatCompletionIdleTimeoutResetsOnChunks(t *testing.T) {
	t.Parallel()

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(http.StatusOK)
		flusher, _ := w.(http.Flusher)

		// Total wall time > idle timeout, but gaps between chunks are short.
		for i := 0; i < 4; i++ {
			payload, _ := json.Marshal(map[string]any{
				"choices": []map[string]any{
					{"delta": map[string]string{"content": "x"}},
				},
			})
			fmt.Fprintf(w, "data: %s\n\n", payload)
			if flusher != nil {
				flusher.Flush()
			}
			time.Sleep(40 * time.Millisecond)
		}
		fmt.Fprintf(w, "data: [DONE]\n\n")
		if flusher != nil {
			flusher.Flush()
		}
	}))
	defer ts.Close()

	c := NewClient(ts.URL, "key", "test-model", "sys", "user", "fixSys", "fixUser", 100*time.Millisecond)
	got, err := c.chatCompletion(context.Background(), []chatMessage{
		{Role: "user", Content: "hi"},
	}, 0.1)
	if err != nil {
		t.Fatalf("chatCompletion: %v", err)
	}
	if got != "xxxx" {
		t.Fatalf("got %q, want xxxx", got)
	}
}
