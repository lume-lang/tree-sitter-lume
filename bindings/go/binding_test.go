package tree_sitter_lume_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_lume "github.com/lume-lang/tree-sitter-lume/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_lume.Language())
	if language == nil {
		t.Errorf("Error loading Lume grammar")
	}
}
