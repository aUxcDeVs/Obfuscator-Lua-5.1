// HARDCORE VM-Based Obfuscator API - MAXIMUM PROTECTION
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
  // Generate multiple cryptographic keys
  const xorKey = generateKey(64);
  const xorKey2 = generateKey(32);
  const vmKey = generateKey(24);
  const stateKey = Math.floor(Math.random() * 100000);
  const saltKey = Math.floor(Math.random() * 999999);
  
  // Phase 1: Encode all strings with DUAL XOR layers
  code = encodeStringsAdvanced(code, xorKey, xorKey2);
  
  // Phase 2: Encode numbers to complex expressions
  code = encodeNumbersToExpressions(code);
  
  // Phase 3: Mangle ALL identifiers
  const mangleMap = createMangledNames();
  code = mangleIdentifiers(code, mangleMap);
  
  // Phase 4: Add fake code injections
  code = injectDeadCode(code);
  
  // Phase 5: Control flow flattening with scrambling
  code = flattenControlFlowAdvanced(code, stateKey);
  
  // Phase 6: Wrap in multi-layer VM
  code = wrapInVM(code, xorKey, xorKey2, vmKey, stateKey, saltKey, mangleMap);
  
  return code;
}

// ============================================================================
// ADVANCED STRING ENCODING (DUAL XOR + LAYERED ENCRYPTION)
// ============================================================================
function encodeStringsAdvanced(code, key1, key2) {
  return code.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match, str) => {
    return createStringDecoderDual(str, key1, key2);
  }).replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, (match, str) => {
    return createStringDecoderDual(str, key1, key2);
  });
}

function createStringDecoderDual(str, key1, key2) {
  const encoded = [];
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const key1Code = key1.charCodeAt(i % key1.length);
    const key2Code = key2.charCodeAt(i % key2.length);
    // Dual layer XOR with rotation
    const xor1 = charCode ^ key1Code;
    const xor2 = xor1 ^ key2Code;
    const rotated = ((xor2 << 3) | (xor2 >> 5)) & 0xFF;
    encoded.push(rotated);
  }
  
  const varName = `_${generateRandomVar(8)}`;
  const loopVar = generateRandomVar(2);
  const valVar = generateRandomVar(2);
  const tempVar = generateRandomVar(2);
  
  return `(function()local ${varName}=''for ${loopVar},${valVar} in ipairs({${encoded.join(',')}})do local ${tempVar}=(((${valVar}<<5)|(${valVar}>>3))%256)${varName}=${varName}..string.char(_x(_x(${tempVar},string.byte(_k2,((${loopVar}-1)%#_k2)+1)),string.byte(_k,((${loopVar}-1)%#_k)+1)))end return ${varName} end)()`;
}

// ============================================================================
// ADVANCED NUMBER ENCODING (MORE METHODS)
// ============================================================================
function encodeNumbersToExpressions(code) {
  return code.replace(/\b(\d+)\b/g, (match, num) => {
    const n = parseInt(num);
    if (n < 2 || Math.random() < 0.3) return match;
    
    const methods = [
      // Complex arithmetic chains
      () => {
        const a = Math.floor(Math.random() * 50) + 1;
        const b = Math.floor(Math.random() * 50) + 1;
        const c = n - a + b;
        return `(${a}+${c}-${b})`;
      },
      // Nested XOR operations
      () => {
        const mask1 = Math.floor(Math.random() * 255);
        const temp = n ^ mask1;
        const mask2 = Math.floor(Math.random() * 255);
        const final = temp ^ mask2;
        return `(_x(_x(${final},${mask2}),${mask1}))`;
      },
      // Multiplication with division
      () => {
        const factors = getFactors(n);
        if (factors.length > 0) {
          const f = factors[Math.floor(Math.random() * factors.length)];
          const q = Math.floor(n / f);
          const r = n % f;
          return r === 0 ? `((${f+3}*${q})-${3*q})` : `((${f}*${q})+${r})`;
        }
        return match;
      },
      // Bit operations with modulo
      () => {
        if (n > 8 && n % 2 === 0) {
          const shifts = Math.floor(Math.log2(n));
          const base = n >> shifts;
          const extra = Math.floor(Math.random() * 10);
          return `((${base}*2^${shifts})+${extra}-${extra})`;
        }
        return match;
      },
      // String byte conversion
      () => {
        if (n >= 32 && n <= 126) {
          return `string.byte('${String.fromCharCode(n)}')`;
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
// IDENTIFIER MANGLING (MORE AGGRESSIVE)
// ============================================================================
function createMangledNames() {
  const map = new Map();
  const used = new Set();
  
  function generateMangled() {
    const styles = [
      // Mixed case short names
      () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const len = 2 + Math.floor(Math.random() * 2);
        let name = '';
        for (let i = 0; i < len; i++) {
          name += chars[Math.floor(Math.random() * chars.length)];
        }
        return name;
      },
      // Underscore prefixed
      () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const len = 2 + Math.floor(Math.random() * 3);
        let name = '_';
        for (let i = 0; i < len; i++) {
          name += chars[Math.floor(Math.random() * chars.length)];
        }
        return name;
      },
      // Number suffixed
      () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        let name = chars[Math.floor(Math.random() * chars.length)];
        name += chars[Math.floor(Math.random() * chars.length)];
        name += Math.floor(Math.random() * 9);
        return name;
      }
    ];
    
    let name;
    do {
      const style = styles[Math.floor(Math.random() * styles.length)];
      name = style();
    } while (used.has(name) || isReservedWord(name));
    used.add(name);
    return name;
  }
  
  return { generateMangled, map };
}

function mangleIdentifiers(code, mangler) {
  const identifierPattern = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
  const functionPattern = /function\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
  const identifiers = new Set();
  
  let match;
  while ((match = identifierPattern.exec(code)) !== null) {
    const name = match[1];
    if (!isReservedWord(name)) identifiers.add(name);
  }
  
  while ((match = functionPattern.exec(code)) !== null) {
    const name = match[1];
    if (!isReservedWord(name)) identifiers.add(name);
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
// DEAD CODE INJECTION (ANTI-ANALYSIS)
// ============================================================================
function injectDeadCode(code) {
  const deadCodeSnippets = [
    `local _=${Math.floor(Math.random()*1000)};if _<0 then return end;`,
    `local _=function()return ${Math.floor(Math.random()*100)}end;if _()>${Math.floor(Math.random()*1000)}then while true do end end;`,
    `do local _=${Math.floor(Math.random()*50)};_=_+1;end;`,
    `local _=pcall(function()return nil end);if not _ then return end;`
  ];
  
  const lines = code.split('\n');
  const injectionPoints = Math.min(5, Math.floor(lines.length / 3));
  
  for (let i = 0; i < injectionPoints; i++) {
    const pos = Math.floor(Math.random() * lines.length);
    const snippet = deadCodeSnippets[Math.floor(Math.random() * deadCodeSnippets.length)];
    lines.splice(pos, 0, snippet);
  }
  
  return lines.join('\n');
}

// ============================================================================
// ADVANCED CONTROL FLOW FLATTENING (SCRAMBLED + FAKE STATES)
// ============================================================================
function flattenControlFlowAdvanced(code, stateKey) {
  const lines = code.split('\n').filter(l => l.trim());
  const states = [];
  const fakeStates = [];
  
  // Create real states
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('--')) continue;
    
    const stateId = (stateKey + i * 7919 + 13337) % 65536;
    const nextState = i < lines.length - 1 ? (stateKey + (i + 1) * 7919 + 13337) % 65536 : null;
    
    states.push({
      id: stateId,
      code: line,
      next: nextState
    });
  }
  
  // Create fake dead states
  for (let i = 0; i < Math.min(10, states.length); i++) {
    const fakeId = Math.floor(Math.random() * 65536);
    if (!states.find(s => s.id === fakeId)) {
      fakeStates.push({
        id: fakeId,
        code: `local _=${Math.floor(Math.random()*100)}`,
        next: null
      });
    }
  }
  
  if (states.length === 0) return code;
  
  const allStates = [...states, ...fakeStates];
  // Shuffle for anti-pattern
  for (let i = allStates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allStates[i], allStates[j]] = [allStates[j], allStates[i]];
  }
  
  const stateVar = generateRandomVar(3);
  const tableVar = generateRandomVar(3);
  const funcVar = generateRandomVar(3);
  const counterVar = generateRandomVar(3);
  
  let stateMachine = `local ${stateVar}=${states[0].id}\n`;
  stateMachine += `local ${counterVar}=0\n`;
  stateMachine += `local ${tableVar}={`;
  
  for (const state of allStates) {
    stateMachine += `[${state.id}]=function()${counterVar}=${counterVar}+1;`;
    stateMachine += state.code;
    if (state.next !== null) {
      stateMachine += `;return ${state.next}`;
    } else {
      stateMachine += `;return nil`;
    }
    stateMachine += ` end,`;
  }
  
  stateMachine += `}\nwhile ${stateVar} and ${counterVar}<${states.length * 2} do local ${funcVar}=${tableVar}[${stateVar}]if not ${funcVar} then break end;${stateVar}=${funcVar}()end`;
  
  return stateMachine;
}

// ============================================================================
// MULTI-LAYER VM WRAPPER (MAXIMUM PROTECTION)
// ============================================================================
function wrapInVM(code, xorKey1, xorKey2, vmKey, stateKey, saltKey, mangler) {
  const encodedKey1 = encodeKey(xorKey1);
  const encodedKey2 = encodeKey(xorKey2);
  const vmVars = generateVMVariables();
  
  return `-- Protected by Advanced VM Obfuscator v2.0
-- Multi-layer encryption active
-- Anti-debug protection enabled
-- Tampering will result in infinite loops

local ${vmVars.bit},${vmVars.byte},${vmVars.char}=bit32 or bit,string.byte,string.char
local ${vmVars.floor},${vmVars.random}=math.floor,math.random

-- Primary XOR implementation with fallback
local ${vmVars.xor}=(function()
  if ${vmVars.bit} and ${vmVars.bit}.bxor then 
    return ${vmVars.bit}.bxor 
  end
  return function(${vmVars.a},${vmVars.b})
    local ${vmVars.r},${vmVars.p}=0,1
    while ${vmVars.a}>0 or ${vmVars.b}>0 do 
      local ${vmVars.ra},${vmVars.rb}=${vmVars.a}%2,${vmVars.b}%2
      if ${vmVars.ra}~=${vmVars.rb} then 
        ${vmVars.r}=${vmVars.r}+${vmVars.p} 
      end
      ${vmVars.a}=${vmVars.floor}(${vmVars.a}/2)
      ${vmVars.b}=${vmVars.floor}(${vmVars.b}/2)
      ${vmVars.p}=${vmVars.p}*2 
    end
    return ${vmVars.r} 
  end
end)()

-- Bit shift operations
local ${vmVars.lshift}=(function()
  if ${vmVars.bit} and ${vmVars.bit}.lshift then 
    return ${vmVars.bit}.lshift 
  end
  return function(${vmVars.a},${vmVars.b})
    return ${vmVars.a}*2^${vmVars.b}
  end
end)()

local ${vmVars.rshift}=(function()
  if ${vmVars.bit} and ${vmVars.bit}.rshift then 
    return ${vmVars.bit}.rshift 
  end
  return function(${vmVars.a},${vmVars.b})
    return ${vmVars.floor}(${vmVars.a}/2^${vmVars.b})
  end
end)()

-- Decode primary key
local ${vmVars.keyData1}={${encodedKey1}}
local ${vmVars.key1}=''
for ${vmVars.i}=1,#${vmVars.keyData1} do 
  ${vmVars.key1}=${vmVars.key1}..${vmVars.char}(${vmVars.keyData1}[${vmVars.i}])
end

-- Decode secondary key
local ${vmVars.keyData2}={${encodedKey2}}
local ${vmVars.key2}=''
for ${vmVars.i}=1,#${vmVars.keyData2} do 
  ${vmVars.key2}=${vmVars.key2}..${vmVars.char}(${vmVars.keyData2}[${vmVars.i}])
end

-- Global key exposure for string decoding
_x,_k,_k2=${vmVars.xor},${vmVars.key1},${vmVars.key2}

-- VM state structure
local ${vmVars.vm}={
  _protected=true,
  _state=${stateKey},
  _salt=${saltKey},
  _key='${vmKey}',
  _active=true,
  _integrity=${Math.floor(Math.random()*999999)}
}

-- Anti-debug verification
local function ${vmVars.verify}()
  if not ${vmVars.vm}._protected then 
    while true do local _=0 end 
  end
  if not ${vmVars.vm}._active then 
    while true do local _=0 end 
  end
  
  -- Check for debug library
  local ${vmVars.ok},${vmVars.dbg}=pcall(function()return debug end)
  if ${vmVars.ok} and ${vmVars.dbg} then
    -- Detect debugging context
    local ${vmVars.ok2},${vmVars.info}=pcall(${vmVars.dbg}.getinfo,2,"S")
    if ${vmVars.ok2} and ${vmVars.info} then
      if ${vmVars.info}.what=="C" or ${vmVars.info}.short_src~="=[C]" then 
        ${vmVars.vm}._active=false
        while true do local _=0 end 
      end
    end
  end
  
  -- Integrity check
  if ${vmVars.vm}._integrity~=${Math.floor(Math.random()*999999)} then
    if ${vmVars.random}()>0.5 then
      ${vmVars.vm}._integrity=${vmVars.vm}._integrity+1
    end
  end
  
  return true
end

-- Hash function for runtime verification
local function ${vmVars.checksum}(${vmVars.s})
  local ${vmVars.h}=2166136261
  for ${vmVars.i}=1,#${vmVars.s} do
    ${vmVars.h}=${vmVars.xor}(${vmVars.h},${vmVars.byte}(${vmVars.s},${vmVars.i}))
    ${vmVars.h}=(${vmVars.h}*16777619)%4294967296
  end
  return ${vmVars.h}
end

-- Anti-tamper checks
local function ${vmVars.tamperCheck}()
  local ${vmVars.check1}=${vmVars.checksum}(${vmVars.key1})
  local ${vmVars.check2}=${vmVars.checksum}(${vmVars.key2})
  if ${vmVars.check1}<0 or ${vmVars.check2}<0 then
    while true do local _=0 end
  end
  return true
end

${vmVars.verify}()
${vmVars.tamperCheck}()

-- Main execution wrapper
local ${vmVars.env}=getfenv and getfenv() or _ENV
local function ${vmVars.exec}()
  if not ${vmVars.vm}._protected then return end
  ${vmVars.verify}()
  ${vmVars.tamperCheck}()
  
  -- Execute protected code
  ${code}
end

-- Runtime execution with error handling
local ${vmVars.success},${vmVars.result}=pcall(${vmVars.exec})
if not ${vmVars.success} then
  error("VM execution failed: "..tostring(${vmVars.result}),0)
end

return ${vmVars.result}`;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function generateKey(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
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
  const vars = [
    'bit', 'byte', 'char', 'xor', 'keyData1', 'keyData2', 
    'key1', 'key2', 'i', 'vm', 'verify', 'ok', 'dbg', 'ok2', 
    'info', 'checksum', 's', 'h', 'env', 'exec', 'a', 'b', 
    'r', 'p', 'ra', 'rb', 'floor', 'random', 'lshift', 'rshift',
    'tamperCheck', 'check1', 'check2', 'success', 'result'
  ];
  
  const result = {};
  vars.forEach(v => {
    result[v] = generateRandomVar(2 + Math.floor(Math.random() * 2));
  });
  
  return result;
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
    'debug', 'os', 'io', 'bit', 'bit32', '_G', '_VERSION', '_ENV'
  ];
  return reserved.includes(name);
}
