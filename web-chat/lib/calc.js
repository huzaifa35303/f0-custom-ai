/**
 * Arithmetic, worked out rather than searched for.
 *
 * "what is 2+2" went to the web, which is slow and faintly ridiculous. This is
 * a real parser rather than `eval`: the input comes from whoever is typing, and
 * handing that to the interpreter would run whatever they sent.
 *
 * It is deliberately small — numbers, + - * / %, powers and brackets. Anything
 * else falls through and the question goes to the web as before.
 */

const SUM = /^[\s\d+\-*/%^().,x×÷]+$/;

/** Is this nothing but a sum? */
export function looksLikeSum(message) {
  const text = message
    .trim()
    .replace(/^(what(?:'s| is)|calculate|compute|solve|kitna|kitne)\s+/i, '')
    .replace(/[=?]+\s*$/, '')
    .trim();

  if (!text || !SUM.test(text)) return null;
  if (!/\d/.test(text) || !/[+\-*/%^x×÷]/.test(text)) return null;
  return text;
}

function tokenize(text) {
  const tokens = [];
  const clean = text.replace(/[x×]/g, '*').replace(/÷/g, '/').replace(/,/g, '');

  for (let i = 0; i < clean.length; ) {
    const ch = clean[i];
    if (/\s/.test(ch)) {
      i++;
    } else if (/[\d.]/.test(ch)) {
      const number = clean.slice(i).match(/^\d*\.?\d+/);
      if (!number) return null;
      tokens.push({ type: 'number', value: Number(number[0]) });
      i += number[0].length;
    } else if ('+-*/%^()'.includes(ch)) {
      tokens.push({ type: ch });
      i++;
    } else {
      return null;
    }
  }
  return tokens;
}

// Precedence climbing: brackets, then ^, then * / %, then + -.
function parse(tokens) {
  let at = 0;
  const peek = () => tokens[at]?.type;

  function expression(minimum = 0) {
    let left = unary();
    if (left === null) return null;

    const levels = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 };
    for (;;) {
      const op = peek();
      const level = levels[op];
      if (!level || level < minimum) break;
      at++;
      // Only ^ associates to the right, so 2^3^2 is 2^9.
      const right = expression(op === '^' ? level : level + 1);
      if (right === null) return null;
      if ((op === '/' || op === '%') && right === 0) return null;
      left =
        op === '+' ? left + right
        : op === '-' ? left - right
        : op === '*' ? left * right
        : op === '/' ? left / right
        : op === '%' ? left % right
        : left ** right;
    }
    return left;
  }

  function unary() {
    if (peek() === '-') {
      at++;
      const value = unary();
      return value === null ? null : -value;
    }
    if (peek() === '+') {
      at++;
      return unary();
    }
    if (peek() === '(') {
      at++;
      const value = expression();
      if (peek() !== ')') return null;
      at++;
      return value;
    }
    if (peek() === 'number') return tokens[at++].value;
    return null;
  }

  const result = expression();
  return at === tokens.length ? result : null;
}

/** The answer as text, or null when this is not a sum we can do. */
export function calculate(message) {
  const sum = looksLikeSum(message);
  if (!sum) return null;

  const tokens = tokenize(sum);
  if (!tokens?.length) return null;

  const value = parse(tokens);
  if (value === null || !Number.isFinite(value)) return null;

  // Long decimals are rounding noise from binary floats, not precision.
  const rounded = Math.round(value * 1e10) / 1e10;
  return `${sum.replace(/\s+/g, ' ')} = ${rounded.toLocaleString('en-US', {
    maximumFractionDigits: 10,
  })}`;
}
