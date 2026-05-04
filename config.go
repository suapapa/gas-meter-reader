package main

import (
	"fmt"
	"os"

	"github.com/goccy/go-yaml"
)

// Config holds YAML-loaded settings for MQTT, concierge, Gemini, and OpenAI-compatible backends.
type Config struct {
	MQTT struct {
		Host  string `yaml:"host"`
		Topic string `yaml:"topic"`
	} `yaml:"mqtt"`
	Concierge struct {
		Addr  string `yaml:"addr"`
		Token string `yaml:"token"`
	} `yaml:"concierge"`
	// Gemini struct {
	// 	APIKey string `yaml:"api_key"`
	// 	Model  string `yaml:"model"`
	// } `yaml:"gemini"`
	OpenAICompat struct {
		BaseURL string `yaml:"base_url"`
		APIKey  string `yaml:"api_key"`
		Model   string `yaml:"model"`
	} `yaml:"openai_compat"`
	SystemPrompt string `yaml:"system_prompt"`
	Prompt       string `yaml:"prompt"`
}

// LoadConfig reads and parses a YAML configuration file into [Config].
func LoadConfig(filename string) (*Config, error) {
	var config Config

	yamlFile, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("open config file: %w", err)
	}
	defer yamlFile.Close()

	decoder := yaml.NewDecoder(yamlFile)
	if err := decoder.Decode(&config); err != nil {
		return nil, fmt.Errorf("decode config file: %w", err)
	}

	return &config, nil
}
