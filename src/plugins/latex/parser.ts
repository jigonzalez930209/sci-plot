/**
 * @fileoverview Simple LaTeX parser for mathematical expressions
 * @module plugins/latex/parser
 */

import { LaTeXNode } from './types';
import { getSymbol, isSymbol } from './symbols';

/**
 * Parse LaTeX string into an abstract syntax tree
 */
export function parseLaTeX(latex: string): LaTeXNode[] {
  const tokens = tokenize(latex);
  return parseTokens(tokens);
}

/**
 * Tokenize LaTeX string
 */
function tokenize(latex: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < latex.length) {
    const char = latex[i];

    // Backslash indicates a command
    if (char === '\\') {
      let command = '';
      i++;
      // Read command name (letters only)
      while (i < latex.length && /[a-zA-Z]/.test(latex[i])) {
        command += latex[i];
        i++;
      }
      if (command) {
        tokens.push('\\' + command);
      } else {
        // Single character command like \{
        if (i < latex.length) {
          tokens.push('\\' + latex[i]);
          i++;
        }
      }
    }
    // Special characters that should be separate tokens
    else if (char === '{' || char === '}' || char === '^' || char === '_') {
      tokens.push(char);
      i++;
    }
    // Skip whitespace
    else if (/\s/.test(char)) {
      i++;
    }
    // Alphanumeric characters - keep them individual
    else if (/[a-zA-Z0-9]/.test(char)) {
      tokens.push(char);
      i++;
    }
    // Other characters (operators like +, -, etc.) - keep individual
    else {
      tokens.push(char);
      i++;
    }
  }

  return tokens;
}

/**
 * Parse tokens into AST nodes
 */
function parseTokens(tokens: string[]): LaTeXNode[] {
  const nodes: LaTeXNode[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    // Superscript
    if (token === '^') {
      i++;
      const content = parseGroup(tokens, i);
      nodes.push({
        type: 'superscript',
        children: content.nodes,
      });
      i = content.nextIndex;
    }
    // Subscript
    else if (token === '_') {
      i++;
      const content = parseGroup(tokens, i);
      nodes.push({
        type: 'subscript',
        children: content.nodes,
      });
      i = content.nextIndex;
    }
    // Commands
    else if (token.startsWith('\\')) {
      const command = token.substring(1);

      // Fraction
      if (command === 'frac') {
        i++;
        const numerator = parseGroup(tokens, i);
        i = numerator.nextIndex;
        const denominator = parseGroup(tokens, i);
        i = denominator.nextIndex;
        nodes.push({
          type: 'fraction',
          numerator: numerator.nodes,
          denominator: denominator.nodes,
        });
      }
      // Square root
      else if (command === 'sqrt') {
        i++;
        const content = parseGroup(tokens, i);
        nodes.push({
          type: 'sqrt',
          children: content.nodes,
        });
        i = content.nextIndex;
      }
      // Symbol
      else if (isSymbol(command)) {
        nodes.push({
          type: 'symbol',
          content: getSymbol(command),
        });
        i++;
      }
      // Unknown command - treat as text
      else {
        nodes.push({
          type: 'text',
          content: token,
        });
        i++;
      }
    }
    // Group start
    else if (token === '{') {
      const content = parseGroup(tokens, i);
      nodes.push({
        type: 'group',
        children: content.nodes,
      });
      i = content.nextIndex;
    }
    // Regular text
    else {
      nodes.push({
        type: 'text',
        content: token,
      });
      i++;
    }
  }

  return nodes;
}

/**
 * Parse a grouped expression (inside braces)
 */
function parseGroup(
  tokens: string[],
  startIndex: number
): { nodes: LaTeXNode[]; nextIndex: number } {
  // If next token is not a brace, treat single token as group
  if (tokens[startIndex] !== '{') {
    return {
      nodes: [
        {
          type: 'text',
          content: tokens[startIndex] || '',
        },
      ],
      nextIndex: startIndex + 1,
    };
  }

  // Skip opening brace
  let i = startIndex + 1;
  const groupTokens: string[] = [];
  let braceDepth = 1;

  // Collect tokens until matching closing brace
  while (i < tokens.length && braceDepth > 0) {
    const token = tokens[i];
    if (token === '{') {
      braceDepth++;
      groupTokens.push(token);
    } else if (token === '}') {
      braceDepth--;
      if (braceDepth > 0) {
        groupTokens.push(token);
      }
    } else {
      groupTokens.push(token);
    }
    i++;
  }

  return {
    nodes: parseTokens(groupTokens),
    nextIndex: i,
  };
}
