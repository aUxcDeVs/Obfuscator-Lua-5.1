// HARDCORE VM-Based Obfuscator API - Fixed Version
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invalid code input' });
    }

    const obfuscated = hardcoreObfuscate(code);
    return res.status(200).json({ obfuscated });
  } catch (error) {
    console.error('Obfuscation error:', error);
    return res.status(500).json({ error: 'Obfuscation failed: ' + error.message });
  }
}

// ============================================================================
// MAIN HARDCORE OBFUSCATION
// ============================================================================
function hardcoreObfuscate(code) {
  // Generate cryptographic keys
  const xorKey = generateKey(32);
  const vmKey = generateKey(16);
  const stateKey = Math.floor(Math.random() * 100000);
  
  // Phase 1: Encode all strings and numbers
  code = encodeStringsAdvanced(code, xorKey);
  code = encodeNumbersToExpressions(code);
  
  // Phase 2: Mangle ALL identifiers
  const mangleMap = createMangledNames();
  code = mangleIdentifiers(code, mangleMap);
  
  // Phase 3: Control flow flattening
  code = flattenControlFlow(code, stateKey);
  
  // Phase 4: Wrap in VM
  code = wrapInVM(code, xorKey, vmKey, stateKey, mangleMap);
  
  return code;
}

// ============================================================================
// ADVANCED STRING ENCODING (XOR + Base conversion) - FIXED
// ============================================================================
function encodeStringsAdvanced(code, key) {
  return code.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match, str) => {
    return createStringDecoder(str, key);
  }).replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, (match, str) => {
    return createStringDecoder(str, key);
  });
}

function createStringDecoder(str, key) {
  const encoded = [];
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const keyCode = key.charCodeAt(i % key.length);
    encoded.push(charCode ^ keyCode); // FIXED: Removed random offset
  }
  
  const varName = `_${generateRandomVar(6)}`;
  // FIXED: Proper loop variable and index handling
  return `(function()local ${varName}=''for i,v in ipairs({${encoded.join(',')}})do ${varName}=${varName}..string.char(_x(v,string.byte(_k,((i-1)%#_k)+1)))end return ${varName} end)()`;
}

// ============================================================================
// NUMBER TO COMPLEX EXPRESSIONS
// ============================================================================
function encodeNumbersToExpressions(code) {
  return code.replace(/\b(\d+)\b/g, (match, num) => {
    const n = parseInt(num);
    if (n < 2 || Math.random() < 0.4) return match;
    
    const methods = [
      // Arithmetic operations
      () => {
        const a = Math.floor(Math.random() * 100) + 1;
        const b = n - a;
        return `(${a}+${b})`;
      },
      // Multiplication with remainder
      () => {
        const factors = getFactors(n);
        if (factors.length > 0) {
          const f = factors[Math.floor(Math.random() * factors.length)];
          const q = Math.floor(n / f);
          const r = n % f;
          return r === 0 ? `(${f}*${q})` : `(${f}*${q}+${r})`;
        }
        return match;
      },
      // XOR operations
      () => {
        const mask = Math.floor(Math.random() * 255);
        const xor = n ^ mask;
        return `(_x(${xor},${mask}))`;
      },
      // Bit shifts
      () => {
        if (n > 16 && n % 2 === 0) {
          const shifts = Math.floor(Math.log2(n));
          const base = n >> shifts;
          return `(${base}*2^${shifts})`;
        }
        return match;
      }
    ];
    
    const result = methods[Math.floor(Math.random() * methods.length)]();
    return result === match ? match : result;
  });
}

function getFactors(n) {
  const factors = [];
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) factors.push(i);
  }
  return factors;
}

// ============================================================================
// IDENTIFIER MANGLING
// ============================================================================
function createMangledNames() {
  const map = new Map();
  const used = new Set();
  
  function generateMangled() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let name;
    do {
      const len = Math.random() < 0.7 ? 2 : 3;
      name = '';
      for (let i = 0; i < len; i++) {
        name += chars[Math.floor(Math.random() * chars.length)];
      }
    } while (used.has(name) || isReservedWord(name));
    used.add(name);
    return name;
  }
  
  return { generateMangled, map };
}

function mangleIdentifiers(code, mangler) {
  const identifierPattern = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
  const identifiers = new Set();
  
  let match;
  while ((match = identifierPattern.exec(code)) !== null) {
    const name = match[1];
    if (!isReservedWord(name)) {
      identifiers.add(name);
    }
  }
  
  identifiers.forEach(name => {
    if (!mangler.map.has(name)) {
      mangler.map.set(name, mangler.generateMangled());
    }
  });
  
  for (const [oldName, newName] of mangler.map) {
    const regex = new RegExp(`\\b${oldName}\\b`, 'g');
    code = code.replace(regex, newName);
  }
  
  return code;
}

// ============================================================================
// CONTROL FLOW FLATTENING - IMPROVED
// ============================================================================
function flattenControlFlow(code, stateKey) {
  const lines = code.split('\n').filter(l => l.trim());
  const states = [];
  
  // Create scrambled state machine
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('--')) continue;
    
    const stateId = (stateKey + i * 7919) % 65536;
    const nextState = i < lines.length - 1 ? (stateKey + (i + 1) * 7919) % 65536 : null;
    
    states.push({
      id: stateId,
      code: line,
      next: nextState
    });
  }
  
  if (states.length === 0) return code;
  
  // Generate state machine with anti-pattern variations
  const stateVar = generateRandomVar();
  const tableVar = generateRandomVar();
  const funcVar = generateRandomVar();
  
  let stateMachine = `local ${stateVar}=${states[0].id}\n`;
  stateMachine += `local ${tableVar}={`;
  
  for (const state of states) {
    stateMachine += `[${state.id}]=function()`;
    stateMachine += state.code;
    if (state.next) {
      stateMachine += ` return ${state.next}`;
    } else {
      stateMachine += ` return nil`;
    }
    stateMachine += ` end,`;
  }
  
  stateMachine += `}\nwhile ${stateVar} do local ${funcVar}=${tableVar}[${stateVar}]if not ${funcVar} then break end ${stateVar}=${funcVar}()end`;
  
  return stateMachine;
}

// ============================================================================
// VM WRAPPER
// ============================================================================
function wrapInVM(code, xorKey, vmKey, stateKey, mangler) {
  const encodedKey = encodeKey(xorKey);
  const vmVars = generateVMVariables();
  
  return `-- Protected by Advanced VM Obfuscator
-- Deobfuscation will result in errors

local ${vmVars.bit},${vmVars.byte},${vmVars.char},${vmVars.pairs}=bit32 or bit,string.byte,string.char,pairs
local ${vmVars.xor}=(function()if ${vmVars.bit} and ${vmVars.bit}.bxor then return ${vmVars.bit}.bxor end;return function(${vmVars.a},${vmVars.b})local ${vmVars.r},${vmVars.p}=0,1;while ${vmVars.a}>0 or ${vmVars.b}>0 do local ${vmVars.ra},${vmVars.rb}=${vmVars.a}%2,${vmVars.b}%2;if(${vmVars.ra}+${vmVars.rb})==1 then ${vmVars.r}=${vmVars.r}+${vmVars.p} end;${vmVars.a}=math.floor(${vmVars.a}/2)${vmVars.b}=math.floor(${vmVars.b}/2)${vmVars.p}=${vmVars.p}*2 end;return ${vmVars.r} end end)()

local ${vmVars.keyData}={${encodedKey}}
local ${vmVars.key}=''
for ${vmVars.i}=1,#${vmVars.keyData} do ${vmVars.key}=${vmVars.key}..${vmVars.char}(${vmVars.keyData}[${vmVars.i}])end

_x,_k=${vmVars.xor},${vmVars.key}

local ${vmVars.vm}={
  _protected=true,
  _state=${stateKey},
  _key='${vmKey}',
  _active=true
}

local function ${vmVars.verify}()
  if not ${vmVars.vm}._protected then while true do local _=0 end end
  if not ${vmVars.vm}._active then while true do local _=0 end end
  local ${vmVars.ok},${vmVars.dbg}=pcall(function()return debug end)
  if ${vmVars.ok} and ${vmVars.dbg} then
    local ${vmVars.ok2},${vmVars.info}=pcall(${vmVars.dbg}.getinfo,2,"S")
    if ${vmVars.ok2} and ${vmVars.info} and ${vmVars.info}.what=="C"then 
      while true do local _=0 end 
    end
  end
  return true
end

local function ${vmVars.checksum}(${vmVars.s})
  local ${vmVars.h}=2166136261
  for ${vmVars.i}=1,#${vmVars.s} do
    ${vmVars.h}=_x(${vmVars.h},${vmVars.byte}(${vmVars.s},${vmVars.i}))
    ${vmVars.h}=(${vmVars.h}*16777619)%4294967296
  end
  return ${vmVars.h}
end

${vmVars.verify}()

local ${vmVars.env}=getfenv()
local function ${vmVars.exec}()
  if not ${vmVars.vm}._protected then return end
  ${vmVars.verify}()
  
  ${code}
end

return ${vmVars.exec}()`;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function generateKey(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let key = '';
  for (let i = 0; i < length; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

function encodeKey(key) {
  const bytes = [];
  for (let i = 0; i < key.length; i++) {
    bytes.push(key.charCodeAt(i));
  }
  return bytes.join(',');
}

function generateRandomVar(length = 2) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let name = '';
  for (let i = 0; i < length; i++) {
    name += chars[Math.floor(Math.random() * chars.length)];
  }
  return name;
}

function generateVMVariables() {
  return {
    bit: generateRandomVar(),
    byte: generateRandomVar(),
    char: generateRandomVar(),
    pairs: generateRandomVar(),
    xor: generateRandomVar(),
    keyData: generateRandomVar(),
    key: generateRandomVar(),
    i: generateRandomVar(),
    vm: generateRandomVar(),
    verify: generateRandomVar(),
    ok: generateRandomVar(),
    dbg: generateRandomVar(),
    ok2: generateRandomVar(),
    info: generateRandomVar(),
    checksum: generateRandomVar(),
    s: generateRandomVar(),
    h: generateRandomVar(),
    env: generateRandomVar(),
    exec: generateRandomVar(),
    a: generateRandomVar(),
    b: generateRandomVar(),
    r: generateRandomVar(),
    p: generateRandomVar(),
    ra: generateRandomVar(),
    rb: generateRandomVar()
  };
}

function isReservedWord(name) {
  const reserved = [
    'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 
    'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 
    'return', 'then', 'true', 'until', 'while',
    'game', 'workspace', 'script', 'wait', 'print', 'warn', 'error',
    'pairs', 'ipairs', 'next', 'pcall', 'xpcall', 'getfenv', 'setfenv',
    'loadstring', 'require', 'module', 'select', 'tonumber', 'tostring',
    'type', 'unpack', 'assert', 'collectgarbage', 'getmetatable', 'setmetatable',
    'rawget', 'rawset', 'rawequal', 'string', 'table', 'math', 'coroutine',
    'debug', 'os', 'io', 'bit', 'bit32', '_G', '_VERSION'
  ];
  return reserved.includes(name);
}
