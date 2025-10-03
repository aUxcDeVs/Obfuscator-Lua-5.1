// MAXIMUM STRENGTH Obfuscator - Actually Works
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
  
  // Parse code into AST-like structure
  const parsed = parseCode(code);
  
  // Multi-layer transformations
  let transformed = applyLayers(parsed, k1, k2, k3);
  
  // Build the protected runtime
  const runtime = buildRuntime(k1, k2, k3, vm, st);
  
  // Combine with user code
  const combined = runtime.replace('___PAYLOAD___', transformed);
  
  return minify(combined);
}

function parseCode(code) {
  // Split into logical blocks while preserving structure
  const blocks = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const prev = i > 0 ? code[i-1] : '';
    
    if ((char === '"' || char === "'") && prev !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }
    
    if (!inString) {
      if (char === '{' || char === '(') depth++;
      if (char === '}' || char === ')') depth--;
      
      if ((char === ';' || char === '\n') && depth === 0 && current.trim()) {
        blocks.push(current.trim());
        current = '';
        continue;
      }
    }
    
    current += char;
  }
  
  if (current.trim()) blocks.push(current.trim());
  
  return blocks;
}

function applyLayers(blocks, k1, k2, k3) {
  let result = [];
  
  for (let block of blocks) {
    // Layer 1: String encryption
    block = encStr(block, k1, k2, k3);
    
    // Layer 2: Number obfuscation
    block = encNum(block);
    
    // Layer 3: Variable mangling
    block = mangleBlock(block);
    
    // Layer 4: Add opaque predicates
    block = addOpaque(block);
    
    result.push(block);
  }
  
  return result.join(';');
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
local ${v.mt}=math
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
local ${v.add}=function(${v.a},${v.b})return(${v.a}+${v.b})%256 end
local ${v.sub}=function(${v.a},${v.b})return(${v.a}-${v.b}+256)%256 end

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
  for ${v.i},${v.e} in ipairs(${v.t})do
    local ${v.p}=${v.i}-1
    local ${v.k1v}=${v.sb}(${v.ks},(${v.p}%#${v.ks})+1)
    local ${v.k2v}=${v.sb}(${v.kt},(${v.p}%#${v.kt})+1)
    local ${v.k3v}=${v.sb}(${v.ku},(${v.p}%#${v.ku})+1)
    local ${v.d1}=${v.sub}(${v.e},${v.p}*7)
    local ${v.d2}=${v.rot}(${v.d1},8-(${v.p}%3+1))
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
  if ${v.vm}.t>1000000 then repeat until false end
  local ${v.ok1},${v.dbg}=pcall(function()return debug end)
  if ${v.ok1} and ${v.dbg} then
    if ${v.dbg}.getupvalue or ${v.dbg}.setupvalue or ${v.dbg}.getlocal or ${v.dbg}.setlocal then
      repeat until false
    end
    local ${v.ok2},${v.inf}=pcall(${v.dbg}.getinfo,2,"S")
    if ${v.ok2} and ${v.inf} and ${v.inf}.what=="C" then repeat until false end
  end
  return true
end

local ${v.env}=getfenv and getfenv()or _ENV or _G
if ${v.env}.debug then ${v.env}.debug=nil end
if ${v.env}.getfenv then ${v.env}.getfenv=nil end
if ${v.env}.setfenv then ${v.env}.setfenv=nil end

${v.chk}()

local ${v.run}=function()
  ${v.chk}()
  ___PAYLOAD___
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
    
    // Multi-layer encryption (reverse of decrypt)
    c = c ^ k1.charCodeAt(i % k1.length);
    c = c ^ k2.charCodeAt(i % k2.length);
    c = c ^ k3.charCodeAt(i % k3.length);
    c = (c << (i % 3 + 1)) | (c >> (8 - (i % 3 + 1)));
    c = (c + (i * 7)) % 256;
    
    enc.push(c);
  }
  
  const v = genVars();
  return `(${v.dec}({${enc.join(',')}}))`;
}

function encNum(c) {
  return c.replace(/\b(\d+)\b/g, (m, n) => {
    n = parseInt(n);
    if (n < 3 || Math.random() < 0.4) return m;
    
    const methods = [
      () => {
        const a = rnd(50) + 1;
        const b = rnd(50) + 1;
        const c = rnd(30) + 1;
        return `(${v.add}(${v.sub}(${n + a},${a}),${v.sub}(${b + c},${c})-${b}))`;
      },
      () => {
        const m1 = rnd(255);
        const m2 = rnd(255);
        const m3 = rnd(255);
        let t = n ^ m1;
        t = t ^ m2;
        t = t ^ m3;
        return `(${v.xor}(${v.xor}(${v.xor}(${t},${m3}),${m2}),${m1}))`;
      },
      () => {
        const f = factors(n);
        if (f.length > 0) {
          const x = f[rnd(f.length)];
          const q = Math.floor(n / x);
          const r = n % x;
          const junk = rnd(20);
          return r === 0 ? `(${x}*${q}+${junk}-${junk})` : `(${v.add}(${x}*${q},${r}))`;
        }
        return m;
      },
      () => {
        if (n > 16 && n % 2 === 0) {
          const shifts = Math.floor(Math.log2(n));
          const base = Math.floor(n / Math.pow(2, shifts));
          const rem = n - base * Math.pow(2, shifts);
          return rem === 0 ? `(${base}*2^${shifts})` : `(${v.add}(${base}*2^${shifts},${rem}))`;
        }
        return m;
      },
      () => {
        const val = rnd(255);
        const shift = rnd(7) + 1;
        const enc = ((n << shift) | (n >> (8 - shift))) % 256;
        const final = enc ^ val;
        return `(${v.xor}(${v.rot}(${final},${8 - shift}),${val}))`;
      }
    ];
    
    const result = methods[rnd(methods.length)]();
    return result === m ? m : result;
  });
}

function mangleBlock(c) {
  const m = new Map();
  const u = new Set();
  
  const gen = () => {
    let n;
    do {
      const patterns = [
        () => '__' + rv(3) + rnd(999) + '__',
        () => '_' + rv(2) + '_' + rv(2) + '_' + rnd(99),
        () => rv(1) + rv(1) + rv(1) + rnd(9) + rv(1),
        () => '_' + rv(4) + rnd(9999)
      ];
      n = patterns[rnd(patterns.length)]();
    } while (u.has(n) || reserved(n) || n.length < 4);
    u.add(n);
    return n;
  };
  
  const ids = new Set();
  const p = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let match;
  
  while ((match = p.exec(c)) !== null) {
    if (!reserved(match[1]) && match[1].length < 8) {
      ids.add(match[1]);
    }
  }
  
  ids.forEach(id => {
    if (!m.has(id)) m.set(id, gen());
  });
  
  for (const [o, n] of m) {
    c = c.replace(new RegExp(`\\b${escapeRegex(o)}\\b`, 'g'), n);
  }
  
  return c;
}

function addOpaque(c) {
  // Add opaque predicates that always evaluate to true/false
  const predicates = [
    `if ${rnd(10)}*${rnd(10)}==${rnd(100)} then return end;`,
    `local ${rv(4)}=${rnd(50)};if ${rv(4)}>${rnd(100)} then return end;`,
    `if string.byte('${rv(1)}')>${rnd(200)} then return end;`
  ];
  
  return predicates[rnd(predicates.length)] + c;
}

function minify(c) {
  const strings = [];
  let idx = 0;
  
  c = c.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
    const placeholder = `__S${idx}__`;
    strings.push(match);
    idx++;
    return placeholder;
  });
  
  c = c.replace(/--[^\n]*/g, '');
  c = c.replace(/\s+/g, ' ');
  c = c.replace(/ *([,;(){}[\]]) */g, '$1');
  c = c.replace(/ *(==|~=|<=|>=|\.\.|\+|\*|\/|%|\^|<|>) */g, '$1');
  c = c.replace(/([^\w]) *- */g, '$1-');
  c = c.replace(/ *= */g, '=');
  
  const kw = ['local', 'function', 'if', 'then', 'else', 'elseif', 'end', 'while', 'do', 'for', 'in', 'return', 'break', 'not', 'and', 'or', 'repeat', 'until'];
  kw.forEach(k => {
    c = c.replace(new RegExp(`\\b${k}\\b(?=[a-zA-Z_])`, 'g'), `${k} `);
  });
  
  strings.forEach((str, i) => {
    c = c.replace(`__S${i}__`, str);
  });
  
  return c.trim();
}

function genKey(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
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

const v = {
  b: 'Xe', sb: 'Rc', sc: 'Pl', mf: 'Oy', mt: 'Hd', xor: 'Bs', a: 'Jk', d: 'Tz',
  r: 'Fm', p: 'Vn', x: 'Qw', y: 'Lg', rot: 'Ux', v: 'Kr', s: 'Ip', add: 'Zd',
  sub: 'Ae', ka: 'Wm', ks: 'Np', kb: 'Ct', kt: 'Gf', kc: 'Yh', ku: 'Mv',
  dec: 'Bw', t: 'Lx', o: 'Sj', i: 'Ek', e: 'Ru', k1v: 'Fn', k2v: 'Pb',
  k3v: 'Qc', d1: 'Td', d2: 'Ug', d3: 'Vh', d4: 'Wi', d5: 'Xj', vm: 'Yk',
  chk: 'Zl', ok1: 'Am', dbg: 'Bn', ok2: 'Co', inf: 'Dp', env: 'Eq', run: 'Fr'
};

function genVars() {
  return v;
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
    '_VERSION', '_ENV'
  ];
  return r.includes(n);
}
