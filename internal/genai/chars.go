package genai

import "strings"

// ContainsOnly reports whether every rune in s appears in the string allowed,
// which is treated as a set of permitted runes (order does not matter).
func ContainsOnly(s, allowed string) bool {
	for _, r := range s {
		if !strings.ContainsRune(allowed, r) {
			return false
		}
	}
	return true
}
