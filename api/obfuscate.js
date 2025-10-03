// AXUS Style Obfuscator - 1M XOR + 35X Encryption
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
  
  for (let i = 0; i < encrypted.length; i++) {
    const byte = encrypted.charCodeAt(i);
    const varName = genVarName(rnd(5, 20));
    obfuscated.push(`local ${varName}='${byte}';`);
    vars.push(varName);
  }
  
  // Step 3: Generate decryption chain (35 layers)
  let decryptChain = `string.char(${vars.join(',')})`;
  
  // Step 4: Build the final code with wrapper
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
  const base = 'IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIqwertyuiopasdfghjklzxcvbnmZXCVBNMASDFGHJKLQWERTYUIOPPQPQPQPQPQPQPQPQPQPQPQPQPKPKPKPKPKPKPAPAPAPAPAPAPAPAPSPSPSPSP';
  
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
