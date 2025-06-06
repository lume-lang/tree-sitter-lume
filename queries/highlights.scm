;; Literals
(string_literal) @string
(boolean_literal) @boolean

[
    (float_literal)
    (integer_literal)
] @number

;; Comments
(doc_comment) @comment.doc

;; Variables
(variable_reference) @variable

;; Types
(type) @type

(struct_definition name:(identifier) @type)
(enum_definition name:(identifier) @type)
(type_alias name:(identifier) @type)

(enum_definition) @enum
(enum_case_definition) @property
(enum_case_properties) @property
(property) @property

[
  (method_definition)
  (function_definition)
] @function

;; Tokens
[
  ";"
  "."
  ","
] @punctuation.delimiter

[
  "--"
  "-"
  "-="
  "&&"
  "+"
  "++"
  "+="
  "<"
  "<="
  "="
  "=="
  "!"
  "!="
  "->"
  ">"
  ">="
  "||"
  "*"
  "*="
  "/"
  "/="
  ":"
] @operator

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
]  @punctuation.bracket

;; Keywords
(self_reference) @keyword
(self) @keyword

[
  "as"
  "break"
  "builtin"
  "continue"
  "else"
  "enum"
  "external"
  "false"
  "fn"
  "for"
  "if"
  "impl"
  "import"
  "in"
  "let"
  "loop"
  "namespace"
  "pub"
  "return"
  "struct"
  "trait"
  "true"
  "type"
  "unless"
  "use"
  "while"
] @keyword
