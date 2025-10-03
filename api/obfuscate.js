// VM-Based Obfuscator - Roblox Compatible
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
  const k1 = genKey(64);
  const k2 = genKey(32);
  const vm = genKey(16);
  const st = rnd(100000);
  
  code = encStr(code, k1, k2);
  code = encNum(code);
  code = mangle(code);
  code = flatten(code, st);
  code = wrap(code, k1, k2, vm, st);
  
  return minify(code);
}

function encStr(c, k1, k2) {
  return c.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (m, s) => mkDec(s, k1, k2))
          .replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, (m, s) => mkDec(s, k1, k2));
}

function mkDec(s, k1, k2) {
  const e = [];
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    const x1 = c ^ k1.charCodeAt(i % k1.length);
    const x2 = x1 ^ k2.charCodeAt(i % k2.length);
    // NO BIT SHIFTS - use multiplication instead for Lua 5.1
    const rotated = ((x2 * 8) % 256 + Math.floor(x2 / 32)) % 256;
    e.push(rotated);
  }
  const v = rv(8);
  const l = rv(2);
  const t = rv(2);
  const temp = rv(2);
  // Fixed: No bit shifts, proper Lua 5.1 syntax
  return `(function()local ${v}=''for ${l},${t} in ipairs({${e.join(',')}})do local ${temp}=(((${t}*32)%256+math.floor(${t}/8))%256)${v}=${v}..string.char(_x(_x(${temp},string.byte(_k2,((${l}-1)%#_k2)+1)),string.byte(_k,((${l}-1)%#_k)+1)))end return ${v} end)()`;
}

function encNum(c) {
  return c.replace(/\b(\d+)\b/g, (m, n) => {
    n = parseInt(n);
    if (n < 2 || Math.random() < 0.3) return m;
    
    const methods = [
      () => {
        const a = rnd(50) + 1;
        const b = rnd(50) + 1;
        return `(${a}+${n - a + b}-${b})`;
      },
      () => {
        const m1 = rnd(255);
        const t = n ^ m1;
        const m2 = rnd(255);
        return `(_x(_x(${t ^ m2},${m2}),${m1}))`;
      },
      () => {
        const f = factors(n);
        if (f.length > 0) {
          const x = f[rnd(f.length)];
          const q = Math.floor(n / x);
          const r = n % x;
          return r === 0 ? `((${x + 3}*${q})-${3 * q})` : `((${x}*${q})+${r})`;
        }
        return m;
      },
      () => {
        if (n > 8 && n % 2 === 0) {
          const shifts = Math.floor(Math.log2(n));
          const base = Math.floor(n / Math.pow(2, shifts));
          return `(${base}*2^${shifts})`;
        }
        return m;
      }
    ];
    
    const result = methods[rnd(methods.length)]();
    return result === m ? m : result;
  });
}

function mangle(c) {
  const m = new Map();
  const u = new Set();
  
  const gen = () => {
    let n;
    do {
      const styles = [
        () => rv(2 + rnd(2)),
        () => '_' + rv(2 + rnd(2)),
        () => rv(2) + rnd(9)
      ];
      n = styles[rnd(styles.length)]();
    } while (u.has(n) || reserved(n));
    u.add(n);
    return n;
  };
  
  const ids = new Set();
  let match;
  const p1 = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
  const p2 = /function\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
  
  while ((match = p1.exec(c)) !== null) {
    if (!reserved(match[1])) ids.add(match[1]);
  }
  while ((match = p2.exec(c)) !== null) {
    if (!reserved(match[1])) ids.add(match[1]);
  }
  
  ids.forEach(id => {
    if (!m.has(id)) m.set(id, gen());
  });
  
  for (const [o, n] of m) {
    c = c.replace(new RegExp(`\\b${escapeRegex(o)}\\b`, 'g'), n);
  }
  
  return c;
}

function flatten(c, st) {
  const lines = c.split('\n').filter(l => l.trim());
  const states = [];
  
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l || l.startsWith('--')) continue;
    
    const sid = (st + i * 7919) % 65536;
    const nxt = i < lines.length - 1 ? (st + (i + 1) * 7919) % 65536 : null;
    
    states.push({ id: sid, code: l, next: nxt });
  }
  
  if (states.length === 0) return c;
  
  const sv = rv(2);
  const tv = rv(2);
  const fv = rv(2);
  
  let sm = `local ${sv}=${states[0].id};local ${tv}={`;
  
  for (const s of states) {
    sm += `[${s.id}]=function()${s.code};${s.next ? `return ${s.next}` : 'return nil'}end,`;
  }
  
  sm += `};while ${sv} do local ${fv}=${tv}[${sv}];if not ${fv} then break end;${sv}=${fv}()end`;
  
  return sm;
}

function wrap(c, k1, k2, vm, st) {
  const ek1 = encKey(k1);
  const ek2 = encKey(k2);
  const v = genVars();
  
  // Proper Lua 5.1 syntax with semicolons and proper spacing
  return `local ${v.b},${v.y},${v.c},${v.f}=bit32 or bit,string.byte,string.char,math.floor;local ${v.x}=(function()if ${v.b} and ${v.b}.bxor then return ${v.b}.bxor end;return function(${v.a},${v.d})local ${v.r},${v.p}=0,1;while ${v.a}>0 or ${v.d}>0 do local ${v.m},${v.n}=${v.a}%2,${v.d}%2;if ${v.m}~=${v.n} then ${v.r}=${v.r}+${v.p} end;${v.a}=${v.f}(${v.a}/2);${v.d}=${v.f}(${v.d}/2);${v.p}=${v.p}*2 end;return ${v.r} end end)();local ${v.k1}={${ek1}};local ${v.s1}='';for ${v.i}=1,#${v.k1} do ${v.s1}=${v.s1}..${v.c}(${v.k1}[${v.i}])end;local ${v.k2}={${ek2}};local ${v.s2}='';for ${v.i}=1,#${v.k2} do ${v.s2}=${v.s2}..${v.c}(${v.k2}[${v.i}])end;_x,_k,_k2=${v.x},${v.s1},${v.s2};local ${v.vm}={_p=true,_s=${st},_k='${vm}',_a=true};local function ${v.vf}()if not ${v.vm}._p then while true do local _=0 end end;if not ${v.vm}._a then while true do local _=0 end end;local ${v.ok},${v.db}=pcall(function()return debug end);if ${v.ok} and ${v.db} then local ${v.o2},${v.in}=pcall(${v.db}.getinfo,2,"S");if ${v.o2} and ${v.in} then if ${v.in}.what=="C" then while true do local _=0 end end end end;return true end;${v.vf}();local ${v.ex}=function()if not ${v.vm}._p then return end;${v.vf}();${c};end;return ${v.ex}()`;
}

function minify(c) {
  // Remove comments
  c = c.replace(/--[^\n]*/g, '');
  
  // Properly handle string preservation
  const strings = [];
  let stringIndex = 0;
  
  // Save strings
  c = c.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
    const placeholder = `__STRING_${stringIndex}__`;
    strings.push(match);
    stringIndex++;
    return placeholder;
  });
  
  // Minify
  c = c.replace(/\s+/g, ' ');
  c = c.replace(/\s*([+\-*/%=<>~,;(){}[\]])\s*/g, '$1');
  c = c.replace(/\s*\.\.\s*/g, '..');
  
  // Keep space after keywords
  const keywords = ['local', 'function', 'if', 'then', 'else', 'elseif', 'end', 'while', 'do', 'for', 'in', 'return', 'break', 'not', 'and', 'or'];
  keywords.forEach(kw => {
    c = c.replace(new RegExp(`\\b${kw}\\b`, 'g'), `${kw} `);
  });
  
  // Restore strings
  strings.forEach((str, idx) => {
    c = c.replace(`__STRING_${idx}__`, str);
  });
  
  return c.trim();
}

function genKey(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let k = '';
  for (let i = 0; i < len; i++) {
    k += chars[rnd(chars.length)];
  }
  return k;
}

function encKey(k) {
  const b = [];
  for (let i = 0; i < k.length; i++) {
    b.push(k.charCodeAt(i));
  }
  return b.join(',');
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
  const vars = ['b', 'y', 'c', 'x', 'a', 'd', 'r', 'p', 'm', 'n', 'k1', 's1', 'k2', 's2', 'i', 'vm', 'vf', 'ok', 'db', 'o2', 'in', 'ex', 'f'];
  const result = {};
  vars.forEach(v => {
    result[v] = rv(2);
  });
  return result;
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
    'pairs', 'ipairs', 'next', 'pcall', 'xpcall', 'getfenv', 'setfenv',
    'loadstring', 'require', 'module', 'select', 'tonumber', 'tostring',
    'type', 'unpack', 'assert', 'collectgarbage', 'getmetatable', 'setmetatable',
    'rawget', 'rawset', 'rawequal', 'string', 'table', 'math', 'coroutine',
    'debug', 'os', 'io', 'bit', 'bit32', '_G', '_VERSION', '_ENV'
  ];
  return r.includes(n);
}
