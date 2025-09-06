/**
 * @file Syntax highlighting for Lume
 * @author Max T. Kristiansen <me@maxtrier.dk>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  range: 0,
  assign: 1,
  cast: 2,
  boolean: 3,
  unary: 4,
  bitwise: 5,
  equality: 6,
  comparison: 7,
  additive: 8,
  multiplicative: 9,
  inc_dec: 10,
  call: 11,
  member: 12,
  construct: 13,
};

// @ts-ignore
module.exports = grammar({
  name: "lume",

  extras: $ => [
    /\s/,
    $.doc_comment,
  ],

  conflicts: $ => [
    [$.path, $.variable_reference]
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($._declaration),

    doc_comment: _ => token(repeat1(choice(
      seq(/\/\//, field('content', /.*\n/))
    ))),

    /**
    * Top-level declaration statements.
    */

    _declaration: $ => choice(
      $.import,
      $.namespace,
      $.struct_definition,
      $.function_definition,
      $.impl,
      $.trait,
      $.trait_impl,
      $.enum_definition,
      $.type_alias,
    ),

    import: $ => seq(
      'import',
      field('root', $.path),
      field('items', seq(
        '(', sep1(',', $.identifier), ')'
      ))
    ),

    namespace: $ => seq(
      'namespace',
      field('path', $.path),
    ),

    _visibility: _ => choice('pub', 'priv'),

    struct_definition: $ => seq(
      optional($.doc_comment),
      optional($._visibility),
      'struct',
      optional('builtin'),
      field('name', $.identifier),
      optional(field('type_parameters', $.type_params)),
      field('properties', in_block($.property))
    ),

    property: $ => seq(
      optional($.doc_comment),
      optional($._visibility),
      field('name', $.identifier),
      ':',
      field('type', $.type),
      optional(seq(
        '=',
        field('default_value', $._expression),
      )),
      ';'
    ),

    parameters: $ => seq('(', sep(',', $.parameter), ')',),

    parameter: $ => choice(
      $.self,
      seq(
        field('name', $.identifier),
        ':',
        field('type', $.type),
      )
    ),

    _block: $ => in_block($.statement),

    _func_modifiers: _ => 'external',

    _function_signature: $ => seq(
      optional($.doc_comment),
      optional($._visibility),
      'fn',
      optional(field('modifiers', $._func_modifiers)),
      field('name', $.function_name),
      optional(field('type_parameters', $.type_params)),
      field('parameters', $.parameters),
      optional(seq('->', field('return_type', $.type))),
    ),

    function_name: $ => choice(
      $.identifier,
      $._operator
    ),

    _operator: _ => choice(
      '+',
      '+=',
      '&&',
      '=',
      '&',
      '|',
      '^',
      '--',
      '/',
      '/=',
      '==',
      '<',
      '<=',
      '++',
      '>',
      '>=',
      '*',
      '*=',
      '!=',
      '||',
      '-',
      '-='
    ),

    method_definition: $ => seq(
      $._function_signature,
      optional(field('block', $._block))
    ),

    method_list: $ => in_block($.method_definition),

    function_definition: $ => seq(
      $._function_signature,
      optional(field('block', $._block))
    ),

    impl: $ => seq(
      optional($.doc_comment),
      optional($._visibility),
      'impl',
      optional(field('type_parameters', $.type_params)),
      field('type', $.type),
      field('block', $.method_list)
    ),

    trait: $ => seq(
      optional($.doc_comment),
      optional($._visibility),
      'trait',
      field('name', $.identifier),
      optional(field('type_parameters', $.type_params)),
      field('block', $.method_list)
    ),

    trait_impl: $ => seq(
      optional($.doc_comment),
      'use',
      field('name', $.type),
      'in',
      field('target', $.type),
      field('block', $.method_list)
    ),

    enum_definition: $ => seq(
      optional($.doc_comment),
      optional($._visibility),
      'enum',
      field('name', $.identifier),
      field('case', curly(seq(
        sep(',', $.enum_case_definition),
        optional(',')
      )))
    ),

    enum_case_definition: $ => seq(
      optional($.doc_comment),
      field('name', $.identifier),
      optional($.enum_case_properties)
    ),

    enum_case_properties: $ => paren(
      field('properties', seq(
        sep(',', $.type),
        optional(',')
      ))
    ),

    type_alias: $ => seq(
      'type',
      field('name', $.identifier),
      '=',
      field('definition', $.type)
    ),

    /**
     * Paths
     */

    path: $ => choice(
      $.self,
      $.identifier,
      $.scoped_identifier,
    ),

    identifier: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    scoped_identifier: $ => prec(1, seq(
      field('root', $.type),
      '::',
      field('name', $.identifier),
    )),

    self: _ => 'self',

    /**
     * Generic types, parameters and arguments
     */

    type_args: $ => seq(
      prec(15, '<'),
      sep(',', $.type),
      optional(','),
      '>',
    ),

    type_params: $ => seq(
      '<',
      sep(',', seq(
        field('name', $.identifier),
        field('bounds', optional($._type_bounds)),
      )),
      optional(','),
      '>',
    ),

    _type_bounds: $ => seq(':', sep1('+', $.type)),

    /**
     * Types
     */

    type: $ => choice(
      $._named_type,
      $.array_type,
    ),

    _named_type: $ => prec.left(seq(
      field('name', $.path),
      optional(field('type_arguments', $.type_args))
    )),

    array_type: $ => seq('[', field('inner', $.type), ']'),

    /**
     * Statements
     */

    statement: $ => choice(
      $.variable_declaration,
      $.break_statement,
      $.continue_statement,
      $.infinite_loop,
      $.iterator_loop,
      prec(1, $.if_conditional),
      $.predicate_loop,
      $.return_statement,
      $._expression_statement
    ),

    variable_declaration: $ => seq(
      'let',
      field('name', $.identifier),
      optional(seq(
        ':',
        field('declared_type', $.type)
      )),
      '=',
      field('value', $._expression),
      ';'
    ),

    break_statement: _ => seq('break', ';'),

    continue_statement: _ => seq('continue', ';'),

    infinite_loop: $ => seq('loop', $._block),

    iterator_loop: $ => seq(
      'for',
      field('name', $.identifier),
      'in',
      field('collection', $._expression),
      field('block', $._block),
    ),

    predicate_loop: $ => seq(
      'while',
      field('condition', $._expression),
      field('block', $._block),
    ),

    _expression_statement: $ => seq($._expression, ';'),

    return_statement: $ => choice(
      prec.left(seq('return', $._expression)),
      prec(-1, 'return'),
      ';'
    ),

    /**
     * Expressions
     */

    _expression: $ => choice(
      $.assignment_expression,
      $.binary_expression,
      $.call_expression,
      $.cast_expression,
      $.construct_expression,
      $.member_expression,
      $.if_conditional,
      $._nested_expression,
      $.variable_reference,
      $.range_expression,
      $.self_reference,
      $.unary_expression,
      $.postfix_expression,
      $._literal,
      prec(1, $.scoped_identifier),
    ),

    assignment_expression: $ => prec.left(PREC.assign, seq(
      field('left', $._expression),
      field('operator', choice('=', '+=', '-=', '*=', '/=')),
      field('right', $._expression),
    )),

    call_expression: $ => prec(PREC.call, seq(
      field('callee', $._expression),
      optional(seq(
        '::',
        field('type_arguments', $.type_args),
      )),
      field('arguments', $._arguments),
    )),

    _arguments: $ => seq(
      '(',
      sep(',', $._expression),
      optional(','),
      ')'
    ),

    cast_expression: $ => prec(PREC.cast, seq(
      field('source', $._expression),
      'as',
      field('type', $.type),
    )),

    binary_expression: $ => {
      /** @type {[number, ChoiceRule][]} */
      const table = [
        [PREC.bitwise, choice('&', '|', '^')],
        [PREC.boolean, choice('&&', '||')],
        [PREC.equality, choice('==', '!=')],
        [PREC.comparison, choice('<', '<=', '>', '>=')],
        [PREC.additive, choice('+', '-')],
        [PREC.multiplicative, choice('*', '/')],
      ];

      return choice(...table.map(([precedence, operator]) => prec.left(precedence, seq(
        field('left', $._expression),
        field('operator', operator),
        field('right', $._expression)
      ))));
    },

    construct_expression: $ => seq(
      field('name', $._named_type),
      field('field', seq('{', sep(',', $.constructor_field), '}')),
    ),

    constructor_field: $ => seq(
      field('name', $.identifier),
      optional(seq(
        ':',
        field('value', $._expression)
      ))
    ),

    member_expression: $ => seq(
      field('value', $._expression),
      '.',
      field('field', $.identifier)
    ),

    if_conditional: $ => seq(
      'if',
      $._conditional_case,
      optional($._else_if_conditional_cases),
      optional(field('else', $._else_conditional_case))
    ),

    _conditional_case: $ => seq(
      field('condition', $._expression),
      field('then', $._block),
    ),

    _else_if_conditional_cases: $ => repeat1(seq(
      'else', 'if',
      field('condition', $._expression),
      field('else_if', $._block),
    )),

    _else_conditional_case: $ => seq(
      'else', field('else', $._block),
    ),

    _nested_expression: $ => seq('(', $._expression, ')'),

    variable_reference: $ => $.identifier,

    range_expression: $ => prec.left(PREC.range, seq(
      field('lower', $._expression),
      '..',
      optional(field('inclusive', '=')),
      field('upper', $._expression),
    )),

    self_reference: $ => prec(1, $.self),

    unary_expression: $ => prec(PREC.unary,
      seq('!', $._expression)
    ),

    postfix_expression: $ => prec(PREC.inc_dec, seq(
      field('value', $._expression),
      field('operation', choice('++', '--'))
    )),

    /**
     * Literals
     */

    _literal: $ => choice(
      $.string_literal,
      $.integer_literal,
      $.float_literal,
      $.boolean_literal,
      $.array_literal,
    ),

    string_literal: _ => token(seq('"', repeat(/[^"]/), '"')),

    integer_literal: _ => token(seq(
      optional('-'),
      choice(
        /[0-9][0-9_]*/,
        /0x[0-9a-fA-F_]+/,
        /0b[01_]+/,
        /0o[0-7_]+/,
      ),
      optional(choice(
        'i8',
        'u8',
        'i16',
        'u16',
        'i32',
        'u32',
        'i64',
        'u64',
      ))
    )),

    float_literal: _ => token(seq(
      optional('-'),
      /[0-9]+/,
      optional(seq(
        '.',
        /[0-9]+/,
      )),
      optional(seq(
        choice('e', 'E'),
        /[0-9]+/,
      )),
      optional(seq('_', choice(
        'f32',
        'f64',
      )))
    )),

    boolean_literal: _ => choice('false', 'true'),

    array_literal: $ => seq('[', sep(',', $._expression), ']'),
  }
});

/**
 * Creates a rule to match the given rule, surrounded by parenthesis.
 *
 * @param {Rule} rule
 *
 * @returns {SeqRule}
 */
function paren(rule) {
  return seq('(', rule, ')');
}

/**
 * Creates a rule to match the given rule, surrounded by curly braces.
 *
 * @param {Rule} rule
 *
 * @returns {SeqRule}
 */
function curly(rule) {
  return seq('{', rule, '}');
}

/**
 * Creates a rule to match one-or-more of the rules separated by the given separator.
 *
 * @param {String} separator
 * @param {Rule} rule
 *
 * @returns {SeqRule}
 */
function sep1(separator, rule) {
  return seq(rule, repeat(seq(separator, rule)));
}

/**
 * Creates a rule to match one-or-more of the rules separated by the given separator.
 *
 * @param {String} separator
 * @param {Rule} rule
 *
 * @returns {ChoiceRule}
 */
function sep(separator, rule) {
  return optional(sep1(separator, rule));
}

/**
 * Creates a rule to match zero-or-more of the rules contained within a block.
 *
 * @param {Rule} rule
 *
 * @returns {SeqRule}
 */
function in_block(rule) {
  return seq('{', optional(repeat1(rule)), '}');
}
