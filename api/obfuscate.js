// Working String Obfuscator for Roblox
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
  // Convert to octal escape sequences
  function toOctal(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const octal = str.charCodeAt(i).toString(8).padStart(3, '0');
      result += '\\' + octal;
    }
    return result;
  }

  // Random variable names
  const genVar = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    return chars[Math.floor(Math.random() * chars.length)];
  };

  const T = genVar();
  const w = genVar();

  // Split code into chunks
  const chunkSize = Math.floor(code.length / (Math.floor(Math.random() * 5) + 3));
  const chunks = [];
  
  for (let i = 0; i < code.length; i += chunkSize) {
    chunks.push(toOctal(code.substring(i, i + chunkSize)));
  }

  // Build string array
  let strArray = `local ${T}={`;
  chunks.forEach((chunk, i) => {
    strArray += `"${chunk}"`;
    if (i < chunks.length - 1) strArray += ',';
  });
  strArray += '}';

  // Simple wrapper that actually works
  const wrapper = `return(function(...)
${strArray}
local ${w}=table.concat(${T})
return(loadstring or load)(${w})()
end)(...)`;

  return wrapper;
}
