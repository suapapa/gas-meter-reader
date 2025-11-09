package genai

import (
	"context"
	"fmt"
	"io"
	"log"
	"strings"
	"time"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
	"google.golang.org/genai"
)

// const geminiModel = "googleai/gemini-2.5-flash-lite"

type Client struct {
	g *genkit.Genkit
	c *genai.Client

	model        string
	systemPrompt string
	promptForImg string

	lastRead string
}

func NewClient(ctx context.Context,
	apiKey string,
	model string,
	systemPrompt string,
	prompt string,
) (*Client, error) {
	gk := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))

	// Create Files API client
	c, err := genai.NewClient(ctx, &genai.ClientConfig{
		Backend: genai.BackendGeminiAPI,
		APIKey:  apiKey, // os.Getenv("GEMINI_API_KEY"),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create client: %v", err)
	}

	return &Client{
		g:            gk,
		c:            c,
		model:        model,
		systemPrompt: systemPrompt,
		promptForImg: prompt,
	}, nil
}

func (c *Client) ReadGasGuagePic(
	ctx context.Context,
	jpgReader io.Reader,
) (*GasMeterReadResult, error) {

	start := time.Now()

	// fileSample, err := c.c.Files.UploadFromPath(ctx, "sample/gauge_20251107_051332.jpg", &genai.UploadFileConfig{
	// 	MIMEType:    "image/jpeg",
	// 	DisplayName: "Test Image",
	// })
	// if err != nil {
	// 	return nil, fmt.Errorf("failed to upload: %v", err)
	// }

	// Initialize Genkit
	file, err := c.c.Files.Upload(ctx, jpgReader, &genai.UploadFileConfig{
		MIMEType:    "image/jpeg",
		DisplayName: "Gas Meter Image",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to upload: %v", err)
	}
	// fmt.Printf("Uploaded! File URI: %s\n", file.URI)
	defer func(ctx context.Context, fileName string) {
		// Clean up
		// c.c.Files.Delete(ctx, sampleFileName, nil)
		c.c.Files.Delete(ctx, fileName, nil)
		// fmt.Println("Cleaned up uploaded file")
	}(ctx, file.Name)

	// Use Files API URI directly with Genkit (now supported!)
	// fmt.Println("Analyzing image with Genkit using Files API URI...")

	out, _, err := genkit.GenerateData[GasMeterReadResult](ctx, c.g,
		ai.WithModelName(c.model),
		ai.WithMessages(
			ai.NewSystemMessage(
				// ai.NewMediaPart("image/jpeg", fileSample.URI), // system prompt denies to use image
				// ai.NewTextPart(readGuagePicPrompt),
				ai.NewTextPart(c.systemPrompt),
			),
			ai.NewUserMessage(
				ai.NewMediaPart("image/jpeg", file.URI),
				// ai.NewTextPart("Process the image and extract the reading and date."),
				ai.NewTextPart(c.promptForImg),
			),
		),
		ai.WithConfig(&genai.GenerateContentConfig{
			TopK:        float32Ptr(10),
			Temperature: float32Ptr(0.1),
		}),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to analyze: %v", err)
	}

	if strings.Contains(out.Read, "?") {
		log.Printf("Ambiguous digits found in the reading: %s", out.Read)
		out.Read, err = c.guessAmbiouousDigits(ctx, out.Read)
		if err != nil {
			return nil, fmt.Errorf("failed to guess ambiguous digits: %v", err)
		}
	}

	out.ItTakes = time.Since(start).String()
	out.ReadAt = time.Now()

	c.lastRead = out.Read

	return out, nil
}

func (c *Client) guessAmbiouousDigits(
	ctx context.Context,
	ambiguousValueString string,
) (string, error) {

	// check if ambigousVauleString only has ? characters and digits characters
	if !containsOnly(ambiguousValueString, ".?0123456789") {
		return "", fmt.Errorf("ambious value string, %s is not valid", ambiguousValueString)
	}

	resp, err := genkit.Generate(ctx, c.g,
		ai.WithModelName(c.model),
		ai.WithMessages(
			ai.NewUserMessage(
				ai.NewTextPart(fmt.Sprintf(fixAmbiguousPromptFmt, ambiguousValueString, c.lastRead)),
			),
		),
		ai.WithConfig(&genai.GenerateContentConfig{
			TopK:        float32Ptr(10),
			Temperature: float32Ptr(0.1),
		}),
	)
	if err != nil {
		return "", fmt.Errorf("failed to generate: %v", err)
	}

	return resp.Text(), nil
}

type GasMeterReadResult struct {
	Read    string    `json:"read"`
	Date    string    `json:"date"`
	ReadAt  time.Time `json:"read_at,omitempty"`
	ItTakes string    `json:"it_takes,omitempty"`
}

const fixAmbiguousPromptFmt = `The value “%s” represents the output of a analog-meter-reading analysis performed on an image.
Uncertain digits within the reading are denoted by the “?” character.

Using the previously recorded meter value "%s" as a reference (only if it is not empty),
infer and replace the “?” characters to estimate the most probable complete reading.

Instructions:
- Return a string with the exact same length as the input value.
- Output only the predicted value, without any explanations or additional text.
`

func containsOnly(s string, chars string) bool {
	for _, c := range s {
		if !strings.Contains(chars, string(c)) {
			return false
		}
	}
	return true
}

func float32Ptr(v float32) *float32 {
	return &v
}
