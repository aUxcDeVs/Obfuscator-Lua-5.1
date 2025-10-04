// api/obfuscate.js

// Original wrapper function
function wrapper(code) {
  return `return(function(...)${code}end)(...)`;
}

// Simple obfuscation - removes comments and extra whitespace
function simpleObfuscation(code) {
  // Remove single line comments
  code = code.replace(/--[^\n]*/g, '');
  
  // Remove multi-line comments
  code = code.replace(/--\[\[[\s\S]*?\]\]/g, '');
  
  // Remove extra whitespace
  code = code.replace(/\s+/g, ' ');
  
  // Remove spaces around operators
  code = code.replace(/\s*([=+\-*/<>~,;(){}[\]])\s*/g, '$1');
  
  return code.trim();
}

// Messy Custom VM Obfuscator
function messyVM(code) {
  const r = () => {
    const c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let n = '';
    for (let i = 0; i < Math.floor(Math.random() * 8) + 6; i++) {
      n += c[Math.floor(Math.random() * c.length)];
    }
    return n;
  };

  // Generate super long fake bytecode patterns
  const generateFakeBytecode = () => {
    let fake = '';
    const ops = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const length = Math.floor(Math.random() * 300) + 200; // 200-500 characters
    
    for (let i = 0; i < length; i++) {
      fake += ops[Math.floor(Math.random() * ops.length)];
      if (Math.random() > 0.7) fake += '/';
    }
    return fake;
  };

  const [vm, stk, pc, ins, op, reg, tmp, env, ret, fn, tbl, idx, val, key, lp, cnt, flg, buf, ptr, jmp, dec, bc] = Array(22).fill(0).map(() => r());
  
  // Encode the actual code
  const encoded = Buffer.from(code).toString('base64');
  
  // Generate multiple fake bytecode blocks
  const fakeBlocks = Array(5).fill(0).map(() => `"${generateFakeBytecode()}"`).join(',\n');
  
  // Create super messy VM with tons of fake bytecode
  return `local ${vm}=function(${ins},${env})
local ${stk}={}local ${reg}={}local ${pc}=1;local ${flg}=0;local ${buf}=""
local ${bc}={${fakeBlocks}}
local ${fn}=function(${op})
if ${op}==0x1 then return ${stk}
elseif ${op}==0x2 then return ${reg}
elseif ${op}==0x3 then return ${pc}
elseif ${op}==0x4 then 
for ${idx}=1,#${bc}do 
local ${tmp}=${bc}[${idx}]
if ${tmp}:find("/")then 
local ${val}=${tmp}:gsub("/","")
${buf}=${buf}..${val}
end 
end 
return ${buf}
elseif ${op}==0x5 then 
${flg}=${flg}+1 
return ${flg}
else return nil end 
end
local ${tbl}={
[0x1]=function(${idx})${stk}[#${stk}+1]=${ins}[${idx}]end,
[0x2]=function(${idx},${val})${reg}[${idx}]=${val}end,
[0x3]=function()${pc}=${pc}+1 end,
[0x4]=function(${key})return ${env}[${key}]end,
[0x5]=function(${tmp})${buf}=${buf}..${tmp}end,
[0x6]=function(${op})for ${lp}=1,${op}do ${flg}=${flg}+1 end end,
[0x7]=function()${fn}(0x4)end,
[0x8]=function(${idx})${bc}[${idx}]=""end
}
for ${lp}=1,#${bc}do 
if #${bc}[${lp}]>100 then 
local ${tmp}=${bc}[${lp}]:sub(1,50)
${buf}=${buf}..${tmp}:gsub("%d","")
end 
end
while ${pc}<=#${ins}do 
${op}=${ins}[${pc}]
if ${op}and ${tbl}[${op}]then 
${tbl}[${op}](${ins}[${pc}+1],${ins}[${pc}+2])
${pc}=${pc}+1 
else 
${pc}=${pc}+1 
end
if ${flg}==0x7F then break end
${flg}=(${flg}+1)%0xFF 
end
return ${ins}
end
local ${ptr}="${encoded}"
local ${dec}=function(${key})
local ${buf}=""
for ${lp}=1,#${key}do 
${buf}=${buf}..string.char(${key}:byte(${lp}))
end
return ${buf}
end
local ${jmp}={}
for ${lp}=1,#${ptr}do 
${jmp}[${lp}]=${ptr}:sub(${lp},${lp})
end
${vm}(${jmp},{load=load,string=string,table=table})
local ${ret}=${dec}(${ptr})
local ${tmp}=load(${ret}:match("^%s*(.-)%s*$"))
if ${tmp}then return ${tmp}(...)end`;

// Main handler
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, options = {} } = req.body;

    // Validate input
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invalid code input' });
    }

    let result = code;
    const steps = [];

    // Step 1: Simple Obfuscation (minify)
    if (options.simpleObfuscation !== false) {
      result = simpleObfuscation(result);
      steps.push('Simple Obfuscation');
    }

    // Step 2: Messy VM
    if (options.messyVM) {
      result = messyVM(result);
      steps.push('Messy Custom VM');
    }

    // Step 3: Wrapper
    if (options.wrapper !== false) {
      result = wrapper(result);
      steps.push('Wrapper');
    }

    // Add timestamp watermark
    const date = new Date().toISOString();
    result = `--[[ Obfuscated | ${date} ]]\n${result}`;
    steps.push('Watermark');

    // Return success response
    return res.status(200).json({
      success: true,
      obfuscated: result,
      stats: {
        originalSize: code.length,
        obfuscatedSize: result.length,
        expansionRatio: (result.length / code.length).toFixed(2),
        appliedSteps: steps
      }
    });

  } catch (error) {
    console.error('Obfuscation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Vercel config
export const config = {
  maxDuration: 10,
  memory: 256
};
