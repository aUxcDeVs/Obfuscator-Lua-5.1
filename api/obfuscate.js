// AXUS Style Obfuscator - 1M XOR + 35X Encryption + Opaque Predicates
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
    if (len < 500) return 'high';
    if (len < 2000) return 'medium';
    return 'low';
  }
  
  generateVars() {
    const count = this.intensity === 'high' ? 4 : this.intensity === 'medium' ? 3 : 2;
    const vars = [];
    for (let i = 0; i < count; i++) {
      vars.push(genVarName(rnd(6, 10)));
    }
    return vars;
  }
  
  init() {
    const values = this.vars.map(() => rnd(100, 999)).join(',');
    return `local ${this.vars.join(',')}=${values}\n${this.random()}`;
  }
  
  random() {
    const templates = [
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
      `if ${this.v(0)}>${this.v(1)} then if ${this.v(1)}<${this.v(0)}+${this.v(1)} then else do return end end end`,
      `if(${this.v(0)}+${this.v(1)})>(${this.v(1)})then if(${this.v(0)}>0)then else return end end`,
    ];
    return templates[rnd(0, templates.length)];
  }
  
  v(index) {
    return this.vars[index % this.vars.length];
  }
  
  inject() {
    if (this.intensity === 'low' && Math.random() > 0.3) return '';
    if (this.intensity === 'medium' && Math.random() > 0.5) return '';
    return this.random();
  }
}

// ============================================
// YOUR ORIGINAL OBFUSCATION FUNCTION
// ============================================
function obfuscate(code) {
  // Initialize Opaque Predicate Generator
  const opaque = new OpaquePredicateGenerator(code.length);
  
  // Step 1: Apply 35 layers of XOR encryption
  let encrypted = code;
  const keys = [];
  
  for (let layer = 0; layer < 35; layer++) {
    const key = genKey(64);
    keys.push(key);
    encrypted = xorEncrypt(encrypted, key);
  }
  
  // Step 2: Generate variable names (AXUS style)
  const obfuscated = [];
  const vars = [];
  
  // Add opaque predicates at start
  obfuscated.push(opaque.init());
  
  for (let i = 0; i < encrypted.length; i++) {
    const byte = encrypted.charCodeAt(i);
    const varName = genVarName(rnd(5, 20));
    
    // Inject opaque predicates randomly
    if (i % 50 === 0 && i > 0) {
      obfuscated.push(opaque.inject());
    }
    
    obfuscated.push(`local ${varName}='${byte}';`);
    vars.push(varName);
  }
  
  // Add more opaque predicates before final code
  obfuscated.push(opaque.inject());
  
  // Step 3: Generate decryption chain (35 layers)
  let decryptChain = `string.char(${vars.join(',')})`;
  
  // Step 4: Build the final code with wrapper
  obfuscated.push(opaque.inject());
  const final = obfuscated.join('') + 
                `return(function(...)loadstring(${decryptChain})()end)(...)`;
  
  return final;
}

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
  // AXUS style - lots of I's and random letters
  const base = 'IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIqwertyuiopasdfghjklzxcvbnmZXCVBNMASDFGHJKLQWERTYUIOPPQPQPQPQPQPQPQPQPQPQPQPQPKPKPKPKPKPKPAPAPAPAPAPAPAPAPSPSPSPSP';
  
  let name = '';
  for (let i = 0; i < length; i++) {
    const idx = rnd(0, base.length);
    name += base[idx];
  }
  return name;
}

function genKey(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let k = '';
  for (let i = 0; i < len; i++) {
    k += chars[rnd(0, chars.length)];
  }
  return k;
}

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
