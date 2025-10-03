// Bytecode + Opaque Predicates Obfuscator
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invalid code input' });
    }

    const obfuscated = obfuscate(code);
    return res.status(200).json({ obfuscated });
  } catch (error) {
    console.error('Obfuscation error:', error);
    return res.status(500).json({ error: 'Obfuscation failed: ' + error.message });
  }
}

function obfuscate(code) {
  // Step 1: Wrapper
  code = wrapper(code);
  
  // Step 2: Inject opaque predicates
  code = injectOpaquePredicates(code);
  
  // Step 3: Convert to bytecode representation
  code = toBytecode(code);
  
  return code;
}

function wrapper(code) {
  return `return(function(...)${code}end)(...)`;
}

function injectOpaquePredicates(code) {
  // Generate opaque predicates (always true/false but hard to analyze)
  const predicates = [
    // Always true predicates
    `((function()local ${rv(2)}=${rnd(100)}*2;return ${rv(2)}%2==0 end)())`,
    `(${rnd(10)}*${rnd(10)}>${rnd(5)})`,
    `(math.floor(${rnd(100)}/2)*2==${rnd(100)}-${rnd(100)}%2)`,
    // Always false predicates
    `((function()local ${rv(2)}=${rnd(100)}*2+1;return ${rv(2)}%2==0 end)())`,
    `(${rnd(5)}<0)`,
  ];
  
  // Split code into statements
  const lines = code.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Don't inject into function declarations or ends
    if (line.trim() && !line.includes('function') && !line.includes('end') && Math.random() > 0.6) {
      // Inject always-true predicate with fake branch
      const truePred = predicates[rnd(3)];
      const fakeCode = `local ${rv(2)}=${rnd(100)};`;
      newLines.push(`if ${truePred} then ${line} else ${fakeCode}end`);
    } else {
      newLines.push(line);
    }
  }
  
  return newLines.join('\n');
}

function toBytecode(code) {
  // Encode string to bytecode-like representation
  const bytes = [];
  for (let i = 0; i < code.length; i++) {
    bytes.push(code.charCodeAt(i));
  }
  
  // XOR encrypt the bytes
  const key = genKey(32);
  const encrypted = [];
  for (let i = 0; i < bytes.length; i++) {
    encrypted.push(bytes[i] ^ key.charCodeAt(i % key.length));
  }
  
  // Generate decoder
  const vars = genVars();
  const keyBytes = [];
  for (let i = 0; i < key.length; i++) {
    keyBytes.push(key.charCodeAt(i));
  }
  
  return `local ${vars.b},${vars.c},${vars.l}=string.byte,string.char,loadstring;` +
         `local ${vars.k}={${keyBytes.join(',')}};` +
         `local ${vars.d}={${encrypted.join(',')}};` +
         `local ${vars.s}='';` +
         `for ${vars.i}=1,#${vars.d} do ` +
         `local ${vars.x}=${vars.d}[${vars.i}];` +
         `local ${vars.y}=${vars.k}[((${vars.i}-1)%#${vars.k})+1];` +
         `local ${vars.r}=${vars.x};` +
         `for ${vars.j}=0,7 do ` +
         `local ${vars.m}=${vars.r}%2;` +
         `local ${vars.n}=math.floor(${vars.y}/2^${vars.j})%2;` +
         `if ${vars.m}~=${vars.n} then ${vars.s}=${vars.s}..${vars.c}(${vars.x}-${vars.y})` +
         `else ${vars.s}=${vars.s}..${vars.c}(${vars.x}+${vars.y})end;` +
         `${vars.r}=math.floor(${vars.r}/2)end end;` +
         `${vars.l}(${vars.s})()`;
}

function genKey(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let k = '';
  for (let i = 0; i < len; i++) {
    k += chars[rnd(chars.length)];
  }
  return k;
}

function rv(len = 2) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let n = '';
  for (let i = 0; i < len; i++) {
    n += chars[rnd(chars.length)];
  }
  return n;
}

function genVars() {
  const varNames = ['b', 'c', 'l', 'k', 'd', 's', 'i', 'x', 'y', 'r', 'j', 'm', 'n'];
  const result = {};
  varNames.forEach(v => {
    result[v] = rv(2);
  });
  return result;
}

function rnd(max) {
  return Math.floor(Math.random() * max);
}
