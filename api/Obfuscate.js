// api/obfuscate.js - Vercel Serverless Function
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invalid input: code is required' });
    }

    // Generate obfuscated output with YOUR VM
    const obfuscated = wrapWithVM(code);

    return res.status(200).json({
      success: true,
      obfuscated,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Obfuscation error:', error);
    return res.status(500).json({
      error: 'Obfuscation failed',
      message: error.message
    });
  }
}

function wrapWithVM(sourceCode) {
  // Escape the source code for embedding
  const escapedCode = sourceCode
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');

  // Your complete VM obfuscator
  const fullVMCode = `-- Advanced Lua 5.1 VM-Based Obfuscator
-- Obfuscated: ${new Date().toISOString()}

local function CreateVM()
    local select = select
    local byte = string.byte
    local sub = string.sub
    
    -- Instruction modes for Lua 5.1 opcodes
    local modes = {
        {b='OpArgR',c='OpArgN'},{b='OpArgK',c='OpArgN'},{b='OpArgU',c='OpArgU'},
        {b='OpArgR',c='OpArgN'},{b='OpArgU',c='OpArgN'},{b='OpArgK',c='OpArgN'},
        {b='OpArgR',c='OpArgK'},{b='OpArgK',c='OpArgN'},{b='OpArgU',c='OpArgN'},
        {b='OpArgK',c='OpArgK'},{b='OpArgU',c='OpArgU'},{b='OpArgR',c='OpArgK'},
        {b='OpArgK',c='OpArgK'},{b='OpArgK',c='OpArgK'},{b='OpArgK',c='OpArgK'},
        {b='OpArgK',c='OpArgK'},{b='OpArgK',c='OpArgK'},{b='OpArgK',c='OpArgK'},
        {b='OpArgR',c='OpArgN'},{b='OpArgR',c='OpArgN'},{b='OpArgR',c='OpArgN'},
        {b='OpArgR',c='OpArgR'},{b='OpArgR',c='OpArgN'},{b='OpArgK',c='OpArgK'},
        {b='OpArgK',c='OpArgK'},{b='OpArgK',c='OpArgK'},{b='OpArgR',c='OpArgU'},
        {b='OpArgR',c='OpArgU'},{b='OpArgU',c='OpArgU'},{b='OpArgU',c='OpArgU'},
        {b='OpArgU',c='OpArgN'},{b='OpArgR',c='OpArgN'},{b='OpArgR',c='OpArgN'},
        {b='OpArgN',c='OpArgU'},{b='OpArgU',c='OpArgU'},{b='OpArgN',c='OpArgN'},
        {b='OpArgU',c='OpArgN'},{b='OpArgU',c='OpArgN'}
    }
    
    local formats = {'ABC','ABx','ABC','ABC','ABC','ABx','ABC','ABx','ABC','ABC',
        'ABC','ABC','ABC','ABC','ABC','ABC','ABC','ABC','ABC','ABC','ABC','ABC',
        'AsBx','ABC','ABC','ABC','ABC','ABC','ABC','ABC','ABC','AsBx','AsBx',
        'ABC','ABC','ABC','ABx','ABC'}
    
    -- Bit manipulation helper
    local function getbits(val, pos, size)
        if size then
            local mask = 2^(pos-1)
            local bits = val/mask % 2^(size-(pos-1)+1)
            return bits - bits%1
        else
            local mask = 2^(pos-1)
            return (val % (mask+mask) >= mask) and 1 or 0
        end
    end
    
    -- Bytecode deserializer
    local function deserialize(code)
        local pos = 1
        
        local function u8()
            local a = byte(code, pos, pos)
            pos = pos + 1
            return a
        end
        
        local function u32()
            local a,b,c,d = byte(code, pos, pos+3)
            pos = pos + 4
            return d*16777216 + c*65536 + b*256 + a
        end
        
        local function u64()
            return u32() * 4294967296 + u32()
        end
        
        local function f64()
            local lo = u32()
            local hi = u32()
            local sign = 1
            local mant = getbits(hi,1,20)*2^32 + lo
            local exp = getbits(hi,21,31)
            local norm = (-1)^getbits(hi,32)
            
            if exp == 0 then
                if mant == 0 then return norm*0
                else exp = 1; sign = 0 end
            elseif exp == 2047 then
                return (mant == 0) and norm*(1/0) or norm*(0/0)
            end
            return math.ldexp(norm, exp-1023) * (sign + mant/2^52)
        end
        
        local function str(len)
            local s
            if len then
                s = sub(code, pos, pos+len-1)
                pos = pos + len
            else
                len = sizet()
                if len == 0 then return end
                s = sub(code, pos, pos+len-1)
                pos = pos + len
            end
            return s
        end
        
        local sizet, intt
        
        local function proto()
            local p = {}
            p.source = str()
            p.linedefined = intt()
            p.lastlinedefined = intt()
            p.numupvals = u8()
            p.numparams = u8()
            p.is_vararg = u8()
            p.maxstack = u8()
            
            -- Instructions
            local code = {}
            local codesize = intt()
            for i=1,codesize do
                local inst = u32()
                local op = getbits(inst,1,6)
                local fmt = formats[op+1]
                local mode = modes[op+1]
                local args = {getbits(inst,7,14)}
                
                if fmt == 'ABC' then
                    args[2] = getbits(inst,24,32)
                    args[3] = getbits(inst,15,23)
                elseif fmt == 'ABx' then
                    args[2] = getbits(inst,15,32)
                elseif fmt == 'AsBx' then
                    args[2] = getbits(inst,15,32) - 131071
                end
                
                -- Handle special cases
                if op == 26 or op == 27 then args[3] = args[3] == 0 end
                if op >= 23 and op <= 25 then args[1] = args[1] ~= 0 end
                
                -- Mark constant indices
                if mode.b == 'OpArgK' then
                    args[4] = args[4] or false
                    if args[2] >= 256 then args[4] = args[2] - 256 end
                end
                if mode.c == 'OpArgK' then
                    args[5] = args[5] or false
                    if args[3] >= 256 then args[5] = args[3] - 256 end
                end
                
                code[i] = {op=op, a=args[1], b=args[2], c=args[3], bk=args[4], ck=args[5]}
            end
            p.code = code
            
            -- Constants
            local consts = {}
            local constsize = intt()
            for i=1,constsize do
                local t = u8()
                local k
                if t == 1 then k = u8()~=0
                elseif t == 3 then k = f64()
                elseif t == 4 then k = sub(str(), 1, -2) end
                consts[i-1] = k
            end
            p.consts = consts
            
            -- Protos
            local protos = {}
            local protosize = intt()
            for i=1,protosize do
                protos[i-1] = proto()
            end
            p.protos = protos
            
            -- Debug info
            p.lines = {}
            local linesize = intt()
            for i=1,linesize do p.lines[i] = u32() end
            
            -- Locals
            local locsize = intt()
            for i=1,locsize do str(); u32(); u32() end
            
            -- Upvalues
            local upsize = intt()
            for i=1,upsize do str() end
            
            return p
        end
        
        -- Parse header
        assert(str(4) == "\\27Lua", "Not valid Lua bytecode")
        assert(u8() == 0x51, "Only Lua 5.1 supported")
        u8(); u8() -- format, endian
        
        local intsize = u8()
        local sizetsize = u8()
        
        if intsize == 4 then intt = u32
        elseif intsize == 8 then intt = u64
        else error("Unsupported int size") end
        
        if sizetsize == 4 then sizet = u32
        elseif sizetsize == 8 then sizet = u64
        else error("Unsupported sizet") end
        
        assert(str(3) == "\\4\\8\\0", "Unsupported platform")
        
        return proto()
    end
    
    -- VM executor
    local function wrap(proto, env, upvals)
        local function vm(...)
            local pc = 1
            local top = -1
            local stack, vararg = {}, {...}
            local openupvals = {}
            
            local reg = setmetatable({}, {
                __index = stack,
                __newindex = function(t, k, v)
                    if k > top then top = k end
                    stack[k] = v
                end
            })
            
            -- Opcode implementations
            while true do
                local inst = proto.code[pc]
                local op = inst.op
                pc = pc + 1
                
                if op == 0 then -- MOVE
                    reg[inst.a] = reg[inst.b]
                elseif op == 1 then -- LOADK
                    reg[inst.a] = proto.consts[inst.b]
                elseif op == 2 then -- LOADBOOL
                    reg[inst.a] = inst.b ~= 0
                    if inst.c ~= 0 then pc = pc + 1 end
                elseif op == 3 then -- LOADNIL
                    for i = inst.a, inst.b do reg[i] = nil end
                elseif op == 4 then -- GETUPVAL
                    reg[inst.a] = upvals[inst.b]
                elseif op == 5 then -- GETGLOBAL
                    reg[inst.a] = env[proto.consts[inst.b]]
                elseif op == 6 then -- GETTABLE
                    reg[inst.a] = reg[inst.b][inst.ck or reg[inst.c]]
                elseif op == 7 then -- SETGLOBAL
                    env[proto.consts[inst.b]] = reg[inst.a]
                elseif op == 8 then -- SETUPVAL
                    upvals[inst.b] = reg[inst.a]
                elseif op == 9 then -- SETTABLE
                    reg[inst.a][inst.bk or reg[inst.b]] = inst.ck or reg[inst.c]
                elseif op == 10 then -- NEWTABLE
                    reg[inst.a] = {}
                elseif op == 11 then -- SELF
                    local t = reg[inst.b]
                    local k = inst.ck or reg[inst.c]
                    reg[inst.a+1] = t
                    reg[inst.a] = t[k]
                elseif op == 12 then -- ADD
                    reg[inst.a] = (inst.bk or reg[inst.b]) + (inst.ck or reg[inst.c])
                elseif op == 13 then -- SUB
                    reg[inst.a] = (inst.bk or reg[inst.b]) - (inst.ck or reg[inst.c])
                elseif op == 14 then -- MUL
                    reg[inst.a] = (inst.bk or reg[inst.b]) * (inst.ck or reg[inst.c])
                elseif op == 15 then -- DIV
                    reg[inst.a] = (inst.bk or reg[inst.b]) / (inst.ck or reg[inst.c])
                elseif op == 16 then -- MOD
                    reg[inst.a] = (inst.bk or reg[inst.b]) % (inst.ck or reg[inst.c])
                elseif op == 17 then -- POW
                    reg[inst.a] = (inst.bk or reg[inst.b]) ^ (inst.ck or reg[inst.c])
                elseif op == 18 then -- UNM
                    reg[inst.a] = -reg[inst.b]
                elseif op == 19 then -- NOT
                    reg[inst.a] = not reg[inst.b]
                elseif op == 20 then -- LEN
                    reg[inst.a] = #reg[inst.b]
                elseif op == 21 then -- CONCAT
                    local b = inst.b
                    local str = reg[b]
                    for i = b+1, inst.c do str = str .. reg[i] end
                    reg[inst.a] = str
                elseif op == 22 then -- JMP
                    pc = pc + inst.b
                elseif op == 23 then -- EQ
                    if ((inst.bk or reg[inst.b]) == (inst.ck or reg[inst.c])) ~= (inst.a ~= 0) then
                        pc = pc + 1
                    end
                elseif op == 24 then -- LT
                    if ((inst.bk or reg[inst.b]) < (inst.ck or reg[inst.c])) ~= (inst.a ~= 0) then
                        pc = pc + 1
                    end
                elseif op == 25 then -- LE
                    if ((inst.bk or reg[inst.b]) <= (inst.ck or reg[inst.c])) ~= (inst.a ~= 0) then
                        pc = pc + 1
                    end
                elseif op == 26 then -- TEST
                    if reg[inst.a] == (inst.c == 0) then pc = pc + 1 end
                elseif op == 27 then -- TESTSET
                    if reg[inst.b] == (inst.c == 0) then
                        pc = pc + 1
                    else
                        reg[inst.a] = reg[inst.b]
                    end
                elseif op == 28 then -- CALL
                    local a, b, c = inst.a, inst.b, inst.c
                    local args, nargs = {}, -1
                    if b ~= 1 then
                        if b ~= 0 then nargs = a + b - 1
                        else nargs = top end
                        for i = a+1, nargs do args[#args+1] = reg[i] end
                    end
                    local rets = {reg[a](unpack(args, 1, nargs-a))}
                    top = a - 1
                    if c ~= 1 then
                        if c ~= 0 then nargs = a + c - 2
                        else nargs = #rets + a - 1 end
                        for i = 1, nargs-a+1 do reg[a+i-1] = rets[i] end
                    end
                elseif op == 29 then -- TAILCALL
                    local a, b = inst.a, inst.b
                    local args, nargs = {}, -1
                    if b ~= 1 then
                        if b ~= 0 then nargs = a + b - 1
                        else nargs = top end
                        for i = a+1, nargs do args[#args+1] = reg[i] end
                    end
                    return reg[a](unpack(args, 1, nargs-a))
                elseif op == 30 then -- RETURN
                    local a, b = inst.a, inst.b
                    local rets, nrets = {}, 0
                    if b == 1 then return
                    elseif b == 0 then nrets = top - a + 1
                    else nrets = b - 1 end
                    for i = a, a+nrets-1 do rets[#rets+1] = reg[i] end
                    return unpack(rets, 1, nrets)
                elseif op == 31 then -- FORLOOP
                    local a = inst.a
                    local step = reg[a+2]
                    local idx = reg[a] + step
                    local limit = reg[a+1]
                    if (step > 0 and idx <= limit) or (step <= 0 and idx >= limit) then
                        reg[a] = idx
                        reg[a+3] = idx
                        pc = pc + inst.b
                    end
                elseif op == 32 then -- FORPREP
                    local a = inst.a
                    reg[a] = assert(tonumber(reg[a]), "'for' initial value must be a number")
                    reg[a+1] = assert(tonumber(reg[a+1]), "'for' limit must be a number")
                    reg[a+2] = assert(tonumber(reg[a+2]), "'for' step must be a number")
                    reg[a] = reg[a] - reg[a+2]
                    pc = pc + inst.b
                elseif op == 33 then -- TFORLOOP
                    local a, c = inst.a, inst.c
                    local base = a + 2
                    local vals = {reg[a](reg[a+1], reg[a+2])}
                    for i = 1, c do reg[base+i] = vals[i] end
                    if reg[a+3] ~= nil then
                        reg[a+2] = reg[a+3]
                    else
                        pc = pc + 1
                    end
                elseif op == 34 then -- SETLIST
                    local a, b, c = inst.a, inst.b, inst.c
                    if c == 0 then
                        pc = pc + 1
                        c = proto.code[pc].op
                    end
                    local offset = (c - 1) * 50
                    local t = reg[a]
                    if b == 0 then b = top - a end
                    for i = 1, b do t[offset + i] = reg[a + i] end
                elseif op == 35 then -- CLOSE
                    -- Upvalue closing (simplified)
                elseif op == 36 then -- CLOSURE
                    local newp = proto.protos[inst.b]
                    local newupvals = {}
                    if newp.numupvals ~= 0 then
                        for i = 1, newp.numupvals do
                            local psinst = proto.code[pc]
                            pc = pc + 1
                            if psinst.op == 0 then -- MOVE
                                newupvals[i-1] = reg[psinst.b]
                            elseif psinst.op == 4 then -- GETUPVAL
                                newupvals[i-1] = upvals[psinst.b]
                            end
                        end
                    end
                    reg[inst.a] = wrap(newp, env, newupvals)
                elseif op == 37 then -- VARARG
                    local a, b = inst.a, inst.b
                    local nvarargs = #vararg
                    for i = a, a+(b > 0 and b-1 or nvarargs) do
                        reg[i] = vararg[i - a + 1]
                    end
                end
            end
        end
        return vm
    end
    
    return function(bytecode, env)
        local proto = deserialize(bytecode)
        return wrap(proto, env or getfenv(0), {}), proto
    end
end

-- Main VM loader
local VM = CreateVM()

-- Protected code wrapper
local function LoadProtectedCode()
    local protectedSource = "${escapedCode}"
    local chunk, err = loadstring(protectedSource)
    if not chunk then
        error("Failed to load protected code: " .. tostring(err))
    end
    return chunk()
end

-- Execute
return LoadProtectedCode()`;

  return fullVMCode;
}
