// FIXED: Structure-Aware Obfuscator
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
  const k1 = genKey(128);
  const k2 = genKey(96);
  const k3 = genKey(64);
  const vm = genKey(32);
  const st = rnd(1000000);
  
  // Build runtime first
  const runtime = buildRuntime(k1, k2, k3, vm, st);
  
  // Transform user code (preserve structure!)
  let transformed = code;
  
  // Encrypt strings
  transformed = encStr(transformed, k1, k2, k3);
  
  // Encrypt numbers
  transformed = encNum(transformed);
  
  // Mangle variables (careful not to break reserved names)
  transformed = mangleVars(transformed);
  
  // Combine
  const final = runtime.replace('__USER_CODE__', transformed);
  
  return minify(final);
}

function buildRuntime(k1, k2, k3, vm, st) {
  const ek1 = encKey(k1);
  const ek2 = encKey(k2);
  const ek3 = encKey(k3);
  const v = genVars();
  
  return `(function()
local ${v.b}=bit32 or bit
local ${v.sb}=string.byte
local ${v.sc}=string.char
local ${v.mf}=math.floor

local ${v.xor}=function(${v.a},${v.d})
  if ${v.b} and ${v.b}.bxor then return ${v.b}.bxor(${v.a},${v.d})end
  local ${v.r},${v.p}=0,1
  while ${v.a}>0 or ${v.d}>0 do
    local ${v.x},${v.y}=${v.a}%2,${v.d}%2
    if ${v.x}~=${v.y} then ${v.r}=${v.r}+${v.p}end
    ${v.a},${v.d}=${v.mf}(${v.a}/2),${v.mf}(${v.d}/2)
    ${v.p}=${v.p}*2
  end
  return ${v.r}
end

local ${v.rot}=function(${v.v},${v.s})
  ${v.v}=${v.v}%256
  return(${v.v}*2^${v.s})%256+${v.mf}(${v.v}/2^(8-${v.s}))
end

local ${v.add}=function(${v.a1},${v.b1})return(${v.a1}+${v.b1})%256 end
local ${v.sub}=function(${v.a2},${v.b2})return(${v.a2}-${v.b2}+256)%256 end

local ${v.ka}={${ek1}}
local ${v.ks}=''
for ${v.i}=1,#${v.ka} do ${v.ks}=${v.ks}..${v.sc}(${v.ka}[${v.i}])end

local ${v.kb}={${ek2}}
local ${v.kt}=''
for ${v.i}=1,#${v.kb} do ${v.kt}=${v.kt}..${v.sc}(${v.kb}[${v.i}])end

local ${v.kc}={${ek3}}
local ${v.ku}=''
for ${v.i}=1,#${v.kc} do ${v.ku}=${v.ku}..${v.sc}(${v.kc}[${v.i}])end

local ${v.dec}=function(${v.t})
  local ${v.o}=''
  for ${v.idx},${v.e} in ipairs(${v.t})do
    local ${v.pos}=${v.idx}-1
    local ${v.k1v}=${v.sb}(${v.ks},(${v.pos}%#${v.ks})+1)
    local ${v.k2v}=${v.sb}(${v.kt},(${v.pos}%#${v.kt})+1)
    local ${v.k3v}=${v.sb}(${v.ku},(${v.pos}%#${v.ku})+1)
    local ${v.d1}=${v.sub}(${v.e},${v.pos}*7)
    local ${v.d2}=${v.rot}(${v.d1},8-(${v.pos}%3+1))
    local ${v.d3}=${v.xor}(${v.d2},${v.k3v})
    local ${v.d4}=${v.xor}(${v.d3},${v.k2v})
    local ${v.d5}=${v.xor}(${v.d4},${v.k1v})
    ${v.o}=${v.o}..${v.sc}(${v.d5})
  end
  return ${v.o}
end

local ${v.vm}={p=true,s=${st},k='${vm}',t=0}
local ${v.chk}=function()
  if not ${v.vm}.p then repeat until false end
  ${v.vm}.t=${v.vm}.t+1
  if ${v.vm}.t>500000 then repeat until false end
  local ${v.ok},${v.dbg}=pcall(function()return debug end)
  if ${v.ok} and ${v.dbg} then
    if ${v.dbg}.getupvalue or ${v.dbg}.setupvalue then repeat until false end
    local ${v.ok2},${v.inf}=pcall(${v.dbg}.getinfo,2,"S")
    if ${v.ok2} and ${v.inf} and ${v.inf}.what=="C" then repeat until false end
  end
  return true
end

${v.chk}()

local ${v.run}=function()
  ${v.chk}()
  __USER_CODE__
end

return ${v.run}()
end)()`;
}

function encStr(c, k1, k2, k3) {
  return c.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (m, s) => {
    if (s.length === 0) return '""';
    return mkEnc(s, k1, k2, k3);
  }).replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, (m, s) => {
    if (s.length === 0) return "''";
    return mkEnc(s, k1, k2, k3);
  });
}

function mkEnc(s, k1, k2, k3) {
  const enc = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    
    // Triple XOR + rotation + addition
    c = c ^ k1.charCodeAt(i % k1.length);
    c = c ^ k2.charCodeAt(i % k2.length);
    c = c ^ k3.charCodeAt(i % k3.length);
    c = c % 256;
    c = (c << (i % 3 + 1)) | (c >> (8 - (i % 3 + 1)));
    c = (c + (i * 7)) % 256;
    
    enc.push(c);
  }
  
  // Use the global decrypt function
  return `(Bw({${enc.join(',')}}))`;
}

function encNum(c) {
  // Match numbers but be careful with table indices and special contexts
  return c.replace(/\b(\d+)(\.\d+)?\b/g, (m, n, decimal) => {
    // Don't encrypt decimals or small numbers
    if (decimal || parseInt(n) < 5) return m;
    
    const num = parseInt(n);
    if (Math.random() < 0.6) return m; // Don't encrypt everything
    
    const methods = [
      () => {
        const a = rnd(30) + 1;
        const b = rnd(30) + 1;
        return `(${a}+${num - a + b}-${b})`;
      },
      () => {
        const f = factors(num);
        if (f.length > 0) {
          const x = f[rnd(f.length)];
          const q = Math.floor(num / x);
          const r = num % x;
          return r === 0 ? `(${x}*${q})` : `(${x}*${q}+${r})`;
        }
        return m;
      },
      () => {
        if (num > 20 && num % 2 === 0) {
          const half = num / 2;
          return `(${half}*2)`;
        }
        return m;
      }
    ];
    
    return methods[rnd(methods.length)]();
  });
}

function mangleVars(c) {
  const m = new Map();
  const u = new Set();
  
  const gen = () => {
    let n;
    do {
      n = '_' + rv(2) + rv(1) + rnd(99);
    } while (u.has(n) || reserved(n));
    u.add(n);
    return n;
  };
  
  // Only mangle local variables that we declare
  const ids = new Set();
  const localPattern = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
  const functionPattern = /\bfunction\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
  
  let match;
  while ((match = localPattern.exec(c)) !== null) {
    const varName = match[1];
    if (!reserved(varName) && varName.length < 15 && !varName.startsWith('_')) {
      ids.add(varName);
    }
  }
  
  while ((match = functionPattern.exec(c)) !== null) {
    const funcName = match[1];
    if (!reserved(funcName) && funcName.length < 15 && !funcName.startsWith('_')) {
      ids.add(funcName);
    }
  }
  
  ids.forEach(id => {
    if (!m.has(id)) m.set(id, gen());
  });
  
  // Replace with word boundaries to avoid partial matches
  for (const [oldName, newName] of m) {
    const regex = new RegExp(`\\b${escapeRegex(oldName)}\\b`, 'g');
    c = c.replace(regex, newName);
  }
  
  return c;
}

function minify(c) {
  const strings = [];
  let idx = 0;
  
  // Save strings
  c = c.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
    const placeholder = `__STR${idx}__`;
    strings.push(match);
    idx++;
    return placeholder;
  });
  
  // Remove comments
  c = c.replace(/--[^\n]*/g, '');
  
  // Collapse whitespace
  c = c.replace(/\s+/g, ' ');
  
  // Remove spaces around operators
  c = c.replace(/ *([,;(){}[\]]) */g, '$1');
  c = c.replace(/ *(==|~=|<=|>=|\.\.|\+|\*|\/|%|\^|<|>) */g, '$1');
  c = c.replace(/([^\w]) *- */g, '$1-');
  c = c.replace(/ *= */g, '=');
  
  // Ensure space after keywords
  const keywords = ['local', 'function', 'if', 'then', 'else', 'elseif', 'end', 'while', 'do', 'for', 'in', 'return', 'break', 'and', 'or', 'not', 'repeat', 'until'];
  keywords.forEach(kw => {
    c = c.replace(new RegExp(`\\b${kw}\\b(?=[a-zA-Z_0-9])`, 'g'), `${kw} `);
  });
  
  // Restore strings
  strings.forEach((str, i) => {
    c = c.replace(`__STR${i}__`, str);
  });
  
  return c.trim();
}

function genKey(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let k = '';
  for (let i = 0; i < len; i++) {
    k += chars[rnd(chars.length)];
  }
  return k;
}

function encKey(k) {
  return Array.from(k).map(c => c.charCodeAt(0)).join(',');
}

function rv(len = 2) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let n = '';
  for (let i = 0; i < len; i++) {
    n += chars[rnd(chars.length)];
  }
  return n;
}

function genVars() {
  return {
    b: 'Xb', sb: 'Rc', sc: 'Pl', mf: 'Oy', xor: 'Bs', a: 'Jk', d: 'Tz',
    r: 'Fm', p: 'Vn', x: 'Qw', y: 'Lg', rot: 'Ux', v: 'Kr', s: 'Ip',
    add: 'Zd', sub: 'Ae', a1: 'Wa', b1: 'Wb', a2: 'Xa', b2: 'Xb',
    ka: 'Wm', ks: 'Np', kb: 'Ct', kt: 'Gf', kc: 'Yh', ku: 'Mv',
    dec: 'Bw', t: 'Lx', o: 'Sj', idx: 'Ek', e: 'Ru', pos: 'Ps',
    k1v: 'Fn', k2v: 'Pb', k3v: 'Qc', d1: 'Td', d2: 'Ug', d3: 'Vh',
    d4: 'Wi', d5: 'Xj', vm: 'Yk', chk: 'Zl', ok: 'Am', dbg: 'Bn',
    ok2: 'Co', inf: 'Dp', run: 'Fr', i: 'Ii'
  };
}

function rnd(max) {
  return Math.floor(Math.random() * max);
}

function factors(n) {
  const f = [];
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) f.push(i);
  }
  return f;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function reserved(n) {
  const r = [
    'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 
    'function', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 
    'return', 'then', 'true', 'until', 'while',
    'game', 'workspace', 'script', 'wait', 'print', 'warn', 'error',
    'pairs', 'ipairs', 'next', 'pcall', 'xpcall', 'string', 'table', 
    'math', 'bit', 'bit32', 'debug', 'getfenv', 'setfenv', 'loadstring',
    'require', 'module', 'select', 'tonumber', 'tostring', 'type', 
    'unpack', 'assert', 'collectgarbage', 'getmetatable', 'setmetatable',
    'rawget', 'rawset', 'rawequal', 'coroutine', 'os', 'io', '_G', 
    '_VERSION', '_ENV', 'player', 'Players', 'RunService', 'UserInputService',
    'Enum', 'Vector3', 'CFrame', 'UDim2', 'Color3', 'Instance', 'tick',
    'spawn', 'task', 'getgenv', 'firetouchinterest', 'Bw'
  ];
  return r.includes(n);
}
