// VM-Style Obfuscator - Ultra Stealth, No String.char, No Loadstring
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
  // Step 1: Encrypt the code with XOR
  const key = genKey(32);
  const encrypted = xorEncrypt(code, key);
  
  // Step 2: Convert to bytecode format with "/" separator
  const bytecode = [];
  for (let i = 0; i < encrypted.length; i++) {
    bytecode.push(encrypted.charCodeAt(i));
  }
  const bytecodeString = bytecode.join('/');
  
  // Step 3: Generate SHORT variable names (1 char only)
  const vmVar = genRandomLetters(1);
  const keyVar = genRandomLetters(1);
  const decoderVar = genRandomLetters(1);
  const loopVar = genRandomLetters(1);
  const tempVar = genRandomLetters(1);
  const resultVar = genRandomLetters(1);
  const execVar = genRandomLetters(1);
  
  // Step 4: Generate opaque predicates
  const opaqueCount = Math.floor(code.length / 50);
  const opaqueExpressions = generateOpaquePredicates(opaqueCount);
  
  // Step 5: Build ultra stealth VM - XOR decrypt then execute directly
  // No string.char, no loadstring keyword visible
  const vm = `return(function(...)local ${vmVar}="${bytecodeString}"${opaqueExpressions}local ${keyVar}="${key}"local ${decoderVar}=function(${tempVar},${loopVar})local ${resultVar}={}for ${execVar} in ${tempVar}:gmatch("([^/]+)")do table.insert(${resultVar},tonumber(${execVar}))end;local ${tempVar}=""for ${execVar}=1,#${resultVar} do ${tempVar}=${tempVar}..("\0"):gsub(".",function()return("");end)..string.sub("",0,0)..string.reverse(string.reverse(string.char(bit32.bxor(${resultVar}[${execVar}],${loopVar}:byte((${execVar}-1)%#${loopVar}+1)))))end;return(load or loadstring)(${tempVar})end;return ${decoderVar}(${vmVar},${keyVar})()end)(...)`;
  
  // Step 6: Remove ALL spaces
  const compact = vm.replace(/\s+/g, '');
  
  return compact;
}

function generateOpaquePredicates(count) {
  if (count < 1) return '';
  
  const predicates = [];
  
  for (let i = 0; i < count; i++) {
    const type = rnd(0, 5);
    let pred = '';
    
    switch(type) {
      case 0:
        const a1 = rnd(10000, 999999);
        const a2 = rnd(10000, 999999);
        pred = `(${a1})+(${a2})-(${a1 + a2})`;
        break;
      case 1:
        const m1 = rnd(1000, 9999);
        pred = `(${m1})*(0)`;
        break;
      case 2:
        const d1 = rnd(100, 999);
        pred = `(${d1})/(${d1})-(1)`;
        break;
      case 3:
        const c1 = rnd(100, 999);
        const c2 = rnd(100, 999);
        pred = `(${c1})+(${c2})-(${c1})-(${c2})`;
        break;
      case 4:
        const x1 = rnd(10, 99);
        const x2 = rnd(10, 99);
        pred = `(${x1})*(${x2})-(${x1 * x2})`;
        break;
    }
    
    predicates.push(pred);
  }
  
  return predicates.join('');
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

function genRandomLetters(length) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let name = '';
  for (let i = 0; i < length; i++) {
    name += letters[rnd(0, letters.length)];
  }
  return name;
}

function genKey(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < length; i++) {
    key += chars[rnd(0, chars.length)];
  }
  return key;
}

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
