// VM-Style Obfuscator - FIXED FOR ROBLOX
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
  // Step 1: XOR encrypt
  const key = genKey(32);
  const encrypted = xorEncrypt(code, key);
  
  // Step 2: Convert to bytecode with "/" separator
  const bytecode = [];
  for (let i = 0; i < encrypted.length; i++) {
    bytecode.push(encrypted.charCodeAt(i));
  }
  const bytecodeString = bytecode.join('/');
  
  // Step 3: Generate unique variable names (longer to avoid conflicts)
  const usedVars = new Set();
  const getUniqueVar = () => {
    let v;
    do {
      v = '_' + genRandomLetters(8);
    } while (usedVars.has(v));
    usedVars.add(v);
    return v;
  };
  
  const dataVar = getUniqueVar();
  const keyVar = getUniqueVar();
  const funcVar = getUniqueVar();
  const bytesVar = getUniqueVar();
  const resultVar = getUniqueVar();
  const iVar = getUniqueVar();
  const nVar = getUniqueVar();
  const xorVar = getUniqueVar();
  
  // Step 4: Generate opaque predicates
  const opaqueCount = Math.floor(Math.random() * 3) + 2;
  const opaqueExpressions = generateOpaquePredicates(opaqueCount);
  
  // Step 5: Build VM with custom XOR function for Roblox compatibility
  const vm = `local ${xorVar}=function(a,b)local c=0;local d=1;while a>0 or b>0 do local e=a%2;local f=b%2;if e~=f then c=c+d end;a=math.floor(a/2);b=math.floor(b/2);d=d*2 end;return c end;return(function()local ${dataVar}="${bytecodeString}"${opaqueExpressions}local ${keyVar}="${key}"local ${funcVar}=function(${dataVar},${keyVar})local ${bytesVar}={}for ${nVar} in ${dataVar}:gmatch("([^/]+)")do table.insert(${bytesVar},tonumber(${nVar}))end;local ${resultVar}=""for ${iVar}=1,#${bytesVar} do ${resultVar}=${resultVar}..string.char(${xorVar}(${bytesVar}[${iVar}],${keyVar}:byte((${iVar}-1)%#${keyVar}+1)))end;return ${resultVar} end;return(loadstring or load)(${funcVar}(${dataVar},${keyVar}))()end)()`;
  
  return vm;
}

function generateOpaquePredicates(count) {
  if (count < 1) return '';
  
  const predicates = [];
  const usedVars = new Set();
  
  for (let i = 0; i < count; i++) {
    const type = rnd(0, 5);
    let pred = '';
    let varName;
    do {
      varName = '_' + genRandomLetters(6);
    } while (usedVars.has(varName));
    usedVars.add(varName);
    
    switch(type) {
      case 0:
        const a1 = rnd(10000, 999999);
        const a2 = rnd(10000, 999999);
        pred = `local ${varName}=${a1}+${a2}-${a1 + a2};`;
        break;
      case 1:
        const m1 = rnd(1000, 9999);
        pred = `local ${varName}=${m1}*0;`;
        break;
      case 2:
        const d1 = rnd(100, 999);
        pred = `local ${varName}=${d1}/${d1}-1;`;
        break;
      case 3:
        const c1 = rnd(100, 999);
        const c2 = rnd(100, 999);
        pred = `local ${varName}=${c1}+${c2}-${c1}-${c2};`;
        break;
      case 4:
        const x1 = rnd(10, 99);
        const x2 = rnd(10, 99);
        pred = `local ${varName}=${x1}*${x2}-${x1 * x2};`;
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
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let name = '';
  for (let i = 0; i < length; i++) {
    name += letters[rnd(0, letters.length - 1)];
  }
  return name;
}

function genKey(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < length; i++) {
    key += chars[rnd(0, chars.length - 1)];
  }
  return key;
}

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
