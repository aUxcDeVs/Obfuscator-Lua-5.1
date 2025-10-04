// WeAreDevs-Style String Obfuscator for Roblox
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
  // Convert code to octal escape sequences
  function toOctal(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      const octal = charCode.toString(8).padStart(3, '0');
      result += '\\' + octal;
    }
    return result;
  }

  // Split code into random chunks
  const chunks = [];
  const chunkSize = Math.floor(Math.random() * 30) + 20; // 20-50 chars per chunk
  
  for (let i = 0; i < code.length; i += chunkSize) {
    const chunk = code.substring(i, i + chunkSize);
    chunks.push(toOctal(chunk));
  }

  // Generate random variable names
  const genVar = (len = 1) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let name = '';
    for (let i = 0; i < len; i++) {
      name += chars[Math.floor(Math.random() * chars.length)];
    }
    return name;
  };

  const tableVar = genVar();
  const funcVar = genVar();
  const indexVar = genVar();

  // Build string table
  let stringTable = `local ${tableVar}={`;
  for (let i = 0; i < chunks.length; i++) {
    stringTable += `"${chunks[i]}"`;
    if (i < chunks.length - 1) stringTable += ';';
  }
  stringTable += '}';

  // Build wrapper function
  const wrapper = `
return(function(...)
${stringTable}
local function ${funcVar}(${indexVar})
return ${tableVar}[${indexVar}-${Math.floor(Math.random() * 100)}]
end
local ${genVar()}=table.concat(${tableVar})
return(loadstring or load)(${genVar()})()
end)(...)`.trim();

  return wrapper;
}

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
