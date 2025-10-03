// AXUS Style Obfuscator - With Auto Opaque Predicates Module
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

// ============================================
// OPAQUE PREDICATES GENERATOR MODULE
// ============================================
class OpaquePredicateGenerator {
  constructor(codeLength) {
    this.codeLength = codeLength;
    this.intensity = this.calculateIntensity(codeLength);
    this.vars = this.generateVars();
  }
  
  calculateIntensity(len) {
    // Short code: high intensity (more predicates)
    // Long code: low intensity (fewer predicates)
    if (len < 500) return 'high';      // 8-12 predicates
    if (len < 2000) return 'medium';   // 4-6 predicates
    return 'low';                       // 2-3 predicates
  }
  
  generateVars() {
    const count = this.intensity === 'high' ? 4 : this.intensity === 'medium' ? 3 : 2;
    const vars = [];
    for (let i = 0; i < count; i++) {
      vars.push(genVarName(rnd(6, 10)));
    }
    return vars;
  }
  
  getPredicateCount() {
    if (this.intensity === 'high') return rnd(8, 13);
    if (this.intensity === 'medium') return rnd(4, 7);
    return rnd(2, 4);
  }
  
  init() {
    const values = this.vars.map(() => rnd(100, 999)).join(',');
    return `local ${this.vars.join(',')}=${values}\n${this.random()}`;
  }
  
  random() {
    const templates = [
      // Always true conditions
      `if ${this.v(0)}*${this.v(0)}>=${this.v(0)} then if ${this.v(1)}+${this.v(1)}>${this.v(1)} then else do return end end end`,
      `if(${this.v(0)}+${this.v(1)})>${this.v(0)} then if true then else return end end`,
      `if ${this.v(0)}~=${this.v(1)} then if ${this.v(0)}==${this.v(0)} then else do return end end end`,
      `if(${this.v(0)}*1)==${this.v(0)} then else do return end end`,
      `if ${this.v(1)}>=0 then if ${this.v(0)}>=0 then else return end end`,
      `if(${this.v(0)}+1)>${this.v(0)} then else do return end end`,
      `if ${this.v(0)}~=nil then if ${this.v(1)}~=nil then else return end end`,
      `if(${this.v(1)}-${this.v(1)})==0 then else do return end end`,
      `if ${this.v(0)}>=${this.v(0)}-1 then else do return end end`,
      `if(${this.v(0)}%${this.v(0)})==0 then else return end end`,
      // More complex nested ones
      `if ${this.v(0)}>${this.v(1)} then if ${this.v(1)}<${this.v(0)}+${this.v(1)} then else do return end end end`,
      `if(${this.v(0)}+${this.v(1)})>(${this.v(1)})then if(${this.v(0)}>0)then else return end end`,
    ];
    return templates[rnd(0, templates.length)];
  }
  
  v(index) {
    return this.vars[index % this.vars.length];
  }
  
  inject(location) {
    // Don't inject if low intensity and random check fails
    if (this.intensity === 'low' && Math.random() > 0.3) return '';
    if (this.intensity === 'medium' && Math.random() > 0.5) return '';
    return this.random();
  }
}

// ============================================
// MAIN OBFUSCATION FUNCTION
// ============================================
function obfuscate(code) {
  const codeLen = code.length;
  const layers = codeLen < 500 ? 10 : codeLen < 2000 ? 7 : 5;
  
  // Initialize Opaque Predicate Generator
  const opaque = new OpaquePredicateGenerator(codeLen);
  
  // Step 1: Apply adaptive XOR encryption
  let encrypted = code;
  const keys = [];
  
  for (let layer = 0; layer < layers; layer++) {
    const key = genKey(32);
    keys.push(key);
    encrypted = xorEncrypt(encrypted, key);
  }
  
  // Step 2: Convert to byte array
  const bytes = [];
  for (let i = 0; i < encrypted.length; i++) {
    bytes.push(encrypted.charCodeAt(i));
  }
  
  // Step 3: Chunk the bytes
  const chunkSize = 50;
  const chunks = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(bytes.slice(i, i + chunkSize).join(','));
  }
  
  // Step 4: Generate variable names
  const dataVar = genVarName(rnd(8, 15));
  const decoderVar = genVarName(rnd(8, 15));
  const resultVar = genVarName(rnd(8, 15));
  
  // Step 5: Build keys array
  const keysArray = keys.map(k => {
    const keyBytes = [];
    for (let i = 0; i < k.length; i++) {
      keyBytes.push(k.charCodeAt(i));
    }
    return `{${keyBytes.join(',')}}`;
  }).join(',');
  
  // Step 6: Generate final code with AUTO opaque predicates
  const final = `local ${dataVar}={${chunks.join(',')}}
${opaque.init()}
local ${decoderVar}=function(d,k)
${opaque.inject('decoder_start')}
local r={}
${opaque.inject('decoder_before_loop')}
for i=1,#d do
${opaque.inject('decoder_loop')}
local ki=((i-1)%#k)+1
r[i]=string.char(bit32.bxor(d[i],k[ki]))
end
${opaque.inject('decoder_after_loop')}
return table.concat(r)
end
${opaque.inject('between_functions')}
local keys={{${keysArray}}}
${opaque.inject('after_keys')}
local ${resultVar}=table.concat((function()
${opaque.inject('converter_start')}
local t={}
for i=1,#${dataVar} do 
${opaque.inject('converter_loop')}
t[i]=string.char(${dataVar}[i])
end
${opaque.inject('converter_end')}
return t
end)())
${opaque.inject('before_decode_loop')}
for i=#keys,1,-1 do
${opaque.inject('decode_loop_start')}
${resultVar}=${decoderVar}((function()
local t={}
for j=1,#${resultVar} do t[j]=${resultVar}:byte(j)end
return t
end)(),keys[i])
${opaque.inject('decode_loop_end')}
end
${opaque.inject('final')}
return loadstring(${resultVar})(...)`;
  
  return final;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function xorEncrypt(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const keyCode = key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode ^ keyCode);
  }
  return result;
}

function genVarName(length) {
  const chars = 'IIIIIIIIIIIIIIIIIIIIIlllllOOOOOO';
  const extras = 'qwertyuiopasdfghjklzxcvbnm';
  
  let name = '';
  for (let i = 0; i < length; i++) {
    if (i % 3 === 0 && i > 0) {
      name += extras[rnd(0, extras.length)];
    } else {
      name += chars[rnd(0, chars.length)];
    }
  }
  return name;
}

function genKey(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let k = '';
  for (let i = 0; i < len; i++) {
    k += chars[rnd(0, chars.length)];
  }
  return k;
}

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
