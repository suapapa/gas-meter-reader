package genai

import (
	"context"
	"io"
	"time"
)

// VisionClient analyzes a JPEG gas-meter image and returns structured read/date.
type VisionClient interface {
	ReadGasGaugePic(ctx context.Context, jpgReader io.Reader) (*GasMeterReadResult, error)
}

type GasMeterReadResult struct {
	Read    string    `json:"read"`
	Date    string    `json:"date"`
	ReadAt  time.Time `json:"read_at,omitempty"`
	ItTakes string    `json:"it_takes,omitempty"`
}
