const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { writeFile, readFile, unlink } = require('fs').promises;
const { join } = require('path');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const PROMETHEUS_PATH = '/app/Prometheus';

app.post('/api/obfuscate', async (req, res) => {
  const { code, preset = 'Weak' } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  const validPresets = ['Weak', 'Medium', 'Strong', 'Minify'];
  if (!validPresets.includes(preset)) {
    return res.status(400).json({ error: 'Invalid preset' });
  }

  const tempId = randomUUID();
  const inputFile = join(PROMETHEUS_PATH, `temp_${tempId}.lua`);
  const outputFile = `${inputFile}.obfuscated.lua`;

  try {
    await writeFile(inputFile, code);

    const command = `cd ${PROMETHEUS_PATH} && lua cli.lua --preset ${preset} temp_${tempId}.lua`;
    
    await new Promise((resolve, reject) => {
      exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || 'Obfuscation failed'));
        } else {
          resolve();
        }
      });
    });

    const obfuscated = await readFile(outputFile, 'utf8');
    
    await unlink(inputFile).catch(() => {});
    await unlink(outputFile).catch(() => {});

    res.json({ obfuscated });
  } catch (err) {
    await unlink(inputFile).catch(() => {});
    await unlink(outputFile).catch(() => {});
    
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
