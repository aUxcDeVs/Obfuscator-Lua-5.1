// ADVANCED VM-Based Obfuscator - Maximum Protection
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
  
  // Multi-layer encryption
  code = wrapWithAdvancedRuntime(code, k1, k2, k3, vm, st);
  code = encStr(code, k1, k2, k3);
  code = encNum(code);
  code = addJunkCode(code);
  code = mangle(code);
  code = addAntiDebug(code);
  code = flatten(code, st);
  code = addAntiTamper(code);
  
  return minify(code);
}

function wrapWithAdvancedRuntime(userCode, k1, k2, k3, vm, st) {
  const ek1 = encKey(k1);
  const ek2 = encKey(k2);
  const ek3 = encKey(k3);
  const v = genVars();
  
  const wrappedUserCode = `return(function(...) ${userCode} end)(...)`;
  
  // Advanced multi-key XOR runtime
  return `local ${v.b},${v.y},${v.c},${v.f}=bit32 or bit,string.byte,string.char,math.floor;local ${v.x}=(function()if ${v.b} and ${v.b}.bxor then return ${v.b}.bxor end;return function(${v.a},${v.d})local ${v.r},${v.p}=0,1;while ${v.a}>0 or ${v.d}>0 do local ${v.m},${v.n}=${v.a}%2,${v.d}%2;if ${v.m}~=${v.n} then ${v.r}=${v.r}+${v.p}end;${v.a}=${v.f}(${v.a}/2);${v.d}=${v.f}(${v.d}/2);${v.p}=${v.p}*2 end;return ${v.r}end end)();local ${v.rot}=function(${v.v1},${v.sh})return(${v.v1}*2^${v.sh})%256+${v.f}(${v.v1}/2^(8-${v.sh}))end;local ${v.add}=function(${v.v1},${v.v2})return(${v.v1}+${v.v2})%256 end;local ${v.sub}=function(${v.v1},${v.v2})return(${v.v1}-${v.v2}+256)%256 end;local ${v.k1}={${ek1}};local ${v.s1}='';for ${v.i}=1,#${v.k1} do ${v.s1}=${v.s1}..${v.c}(${v.k1}[${v.i}])end;local ${v.k2}={${ek2}};local ${v.s2}='';for ${v.i}=1,#${v.k2} do ${v.s2}=${v.s2}..${v.c}(${v.k2}[${v.i}])end;local ${v.k3}={${ek3}};local ${v.s3}='';for ${v.i}=1,#${v.k3} do ${v.s3}=${v.s3}..${v.c}(${v.k3}[${v.i}])end;_x,_k,_k2,_k3,_rot,_add,_sub=${v.x},${v.s1},${v.s2},${v.s3},${v.rot},${v.add},${v.sub};local ${v.vm}={_p=true,_s=${st},_k='${vm}',_a=true,_t=os and os.time and os.time()or 0};local function ${v.vf}()if not ${v.vm}._p then while true do end end;if not ${v.vm}._a then while true do end end;if ${v.vm}._t>0 and os and os.time then local ${v.ct}=os.time();if ${v.ct}-${v.vm}._t>5 then while true do end end;${v.vm}._t=${v.ct}end;local ${v.ok},${v.db}=pcall(function()return debug end);if ${v.ok} and ${v.db} then local ${v.o2},${v.in}=pcall(${v.db}.getinfo,2,"S");if ${v.o2} and ${v.in} and ${v.in}.what=="C" then while true do end end;if ${v.db}.getupvalue or ${v.db}.setupvalue or ${v.db}.setlocal or ${v.db}.getlocal then while true do end end end;local ${v.o3},${v.ge}=pcall(function()return getfenv end);if ${v.o3} and ${v.ge} then local ${v.env}=${v.ge}();if ${v.env}.debug or ${v.env}.getfenv or ${v.env}.setfenv then while true do end end end;return true end;${v.vf}();local ${v.ex}=function()if not ${v.vm}._p then return end;${v.vf}();${wrappedUserCode}end;return ${v.ex}()`;
}

function encStr(c, k1, k2, k3) {
  return c.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (m, s) => mkAdvDec(s, k1, k2, k3))
          .replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, (m, s) => mkAdvDec(s, k1, k2, k3));
}

function mkAdvDec(s, k1, k2, k3) {
  const e = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    
    // Multi-layer encryption
    const x1 = c ^ k1.charCodeAt(i % k1.length);
    const x2 = x1 ^ k2.charCodeAt(i % k2.length);
    const x3 = x2 ^ k3.charCodeAt(i % k3.length);
    const rot = (x3 << (i % 3 + 1)) | (x3 >> (8 - (i % 3 + 1)));
    const final = (rot + (i * 7)) % 256;
    
    e.push(final);
  }
  
  const v = rv(8);
  const l = rv(3);
  const t = rv(3);
  const idx = rv(3);
  
  return `(function()local ${v}='';for ${l},${t} in ipairs({${e.join(',')}})do local ${idx}=(${l}-1);${v}=${v}..string.char(_sub(_rot(_x(_x(_x(${t},string.byte(_k3,(${idx}%#_k3)+1)),string.byte(_k2,(${idx}%#_k2)+1)),string.byte(_k,((${idx})%#_k)+1)),(8-(${idx}%3+1))),${idx}*7))end;return ${v} end)()`;
}

function encNum(c) {
  return c.replace(/\b(\d+)\b/g, (m, n) => {
    n = parseInt(n);
    if (n < 2 || Math.random() < 0.3) return m;
    
    const methods = [
      () => {
        const a = rnd(100) + 1;
        const b = rnd(100) + 1;
        const c = rnd(50) + 1;
        return `(_add(_sub(${n + a},${a}),_sub(${b + c},${c})-${b}))`;
      },
      () => {
        const m1 = rnd(255);
        const m2 = rnd(255);
        const m3 = rnd(255);
        const t1 = n ^ m1;
        const t2 = t1 ^ m2;
        return `(_x(_x(_x(${t2 ^ m3},${m3}),${m2}),${m1}))`;
      },
      () => {
        const f = factors(n);
        if (f.length > 0) {
          const x = f[rnd(f.length)];
          const q = Math.floor(n / x);
          const r = n % x;
          const add = rnd(50);
          return r === 0 ? `(_sub(${x}*${q}+${add},${add}))` : `(_add(${x}*${q},${r}))`;
        }
        return m;
      },
      () => {
        if (n > 8) {
          const shifts = Math.floor(Math.log2(n));
          const base = Math.floor(n / Math.pow(2, shifts));
          const rem = n % Math.pow(2, shifts);
          return rem === 0 ? `(${base}*2^${shifts})` : `(_add(${base}*2^${shifts},${rem}))`;
        }
        return m;
      },
      () => {
        const rot_val = rnd(255);
        const shift = rnd(7) + 1;
        const encrypted = ((n << shift) | (n >> (8 - shift))) % 256;
        const final = encrypted ^ rot_val;
        return `(_x(_rot(${final},${8 - shift}),${rot_val}))`;
      }
    ];
    
    const result = methods[rnd(methods.length)]();
    return result === m ? m : result;
  });
}

function addJunkCode(c) {
  const junk = [];
  const numJunk = rnd(5) + 3;
  
  for (let i = 0; i < numJunk; i++) {
    const junkTypes = [
      () => `local ${rv(3)}=${rnd(1000)};`,
      () => `local ${rv(3)}=function()return ${rnd(100)}end;`,
      () => `local ${rv(3)}={${rnd(10)},${rnd(10)},${rnd(10)}};`,
      () => `if ${rnd(100)}>${rnd(200)}then local ${rv(3)}=${rnd(50)}end;`,
      () => `local ${rv(3)}=string.char(${rnd(65) + 65});`,
    ];
    junk.push(junkTypes[rnd(junkTypes.length)]());
  }
  
  return junk.join('') + c;
}

function addAntiDebug(c) {
  const v1 = rv(3);
  const v2 = rv(3);
  const v3 = rv(3);
  
  const antiDebug = `local ${v1}=0;local ${v2}=function()${v1}=${v1}+1;if ${v1}>${rnd(50) + 100}then while true do end end end;local ${v3}=function()if debug and debug.gethook and debug.gethook()~=nil then while true do end end;${v2}()end;`;
  
  return antiDebug + c;
}

function addAntiTamper(c) {
  const checksum = hashCode(c);
  const v1 = rv(3);
  const v2 = rv(3);
  
  const tamperCheck = `local ${v1}=${checksum};local ${v2}=function(${rv(2)})local ${rv(2)}=0;for ${rv(2)}=1,#${rv(2)} do ${rv(2)}=${rv(2)}+string.byte(${rv(2)},${rv(2)})end;return ${rv(2)}end;`;
  
  return tamperCheck + c;
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function mangle(c) {
  const m = new Map();
  const u = new Set();
  
  const gen = () => {
    let n;
    do {
      const styles = [
        () => rv(3 + rnd(3)),
        () => '_' + rv(2 + rnd(3)) + rnd(999),
        () => rv(1) + rv(1) + rnd(99) + rv(1),
        () => '__' + rv(3) + '__',
        () => rv(2) + '_' + rv(2) + '_' + rv(2)
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
  const lines = c.split(/[;\n]/).filter(l => l.trim() && !l.trim().startsWith('--'));
  
  if (lines.length <= 2) return c;
  
  const states = [];
  const scramble = Array.from({length: lines.length}, (_, i) => i);
  
  // Shuffle execution order
  for (let i = scramble.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [scramble[i], scramble[j]] = [scramble[j], scramble[i]];
  }
  
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    const sid = (st + scramble[i] * 7919 + rnd(1000)) % 1000000;
    const nxt = i < lines.length - 1 ? (st + scramble[i + 1] * 7919 + rnd(1000)) % 1000000 : null;
    
    states.push({ id: sid, code: l, next: nxt, orig: i });
  }
  
  // Sort states by scrambled order
  states.sort((a, b) => scramble[a.orig] - scramble[b.orig]);
  
  const sv = rv(3);
  const tv = rv(3);
  const fv = rv(3);
  const cv = rv(3);
  
  let sm = `local ${sv}=${states[0].id};local ${cv}=0;local ${tv}={`;
  
  for (const s of states) {
    const junk1 = rnd(100);
    const junk2 = rnd(100);
    sm += `[${s.id}]=function()${cv}=${cv}+1;if ${cv}>${rnd(50) + 200}then return nil end;local ${rv(2)}=${junk1};local ${rv(2)}=${junk2};${s.code};return ${s.next || 'nil'}end,`;
  }
  
  sm += `};while ${sv} do local ${fv}=${tv}[${sv}];if not ${fv} then break end;${sv}=${fv}()end`;
  
  return sm;
}

function minify(c) {
  const strings = [];
  let idx = 0;
  
  c = c.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
    const placeholder = `__STR${idx}__`;
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
  
  const keywords = ['local', 'function', 'if', 'then', 'else', 'elseif', 'end', 'while', 'do', 'for', 'in', 'return', 'break', 'not', 'and', 'or', 'repeat', 'until'];
  keywords.forEach(kw => {
    c = c.replace(new RegExp(`\\b${kw}\\b(?=[a-zA-Z_])`, 'g'), `${kw} `);
  });
  
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
  const vars = ['b', 'y', 'c', 'x', 'a', 'd', 'r', 'p', 'm', 'n', 'k1', 's1', 'k2', 's2', 'k3', 's3', 'i', 'vm', 'vf', 'ok', 'db', 'o2', 'o3', 'in', 'ex', 'f', 'rot', 'add', 'sub', 'v1', 'v2', 'sh', 'ge', 'env', 'ct'];
  const result = {};
  vars.forEach(v => {
    result[v] = rv(3);
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
    'debug', 'os', 'io', 'bit', 'bit32', '_G', '_VERSION', '_ENV',
    '_x', '_k', '_k2', '_k3', '_rot', '_add', '_sub'
  ];
  return r.includes(n);
}
