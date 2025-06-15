
const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json({ limit: '5mb' })); // Increased limit for code payload

const PORT = process.env.PORT || 3001;
const EXECUTION_TIMEOUT_MS = 10000; // 10 seconds for execution
const COMPILATION_TIMEOUT_MS = 10000; // 10 seconds for compilation

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.post('/run', async (req, res) => {
  const { code, input = '' } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  let tempDir;
  const uniqueId = uuidv4(); // Unique ID for this execution run

  try {
    // Create a unique temporary directory for each execution
    const baseTmpDir = path.join(os.tmpdir(), 'cpp-runner');
    await fs.mkdir(baseTmpDir, { recursive: true }); // Ensure base temp dir exists
    tempDir = await fs.mkdtemp(path.join(baseTmpDir, `exec-${uniqueId}-`));
    
    const cppFilePath = path.join(tempDir, 'main.cpp');
    const outputFilePath = path.join(tempDir, 'main.out');

    await fs.writeFile(cppFilePath, code);

    // Compile the C++ code
    const compileProcess = spawn('g++', [cppFilePath, '-o', outputFilePath, '-std=c++17']);
    
    let compileStdout = '';
    let compileStderr = '';
    let compileKilledByTimeout = false;

    const compileTimeout = setTimeout(() => {
      if (!compileProcess.killed) {
        compileProcess.kill('SIGKILL');
        compileKilledByTimeout = true;
      }
    }, COMPILATION_TIMEOUT_MS);

    compileProcess.stdout.on('data', (data) => { compileStdout += data.toString(); });
    compileProcess.stderr.on('data', (data) => { compileStderr += data.toString(); });

    compileProcess.on('error', (err) => { // Handle g++ spawn errors
      clearTimeout(compileTimeout);
      console.error(`Compilation process spawn error for ${uniqueId}:`, err);
      compileStderr += `\nFailed to start g++ compiler: ${err.message}`;
      // 'close' will still fire, so we don't resolve the promise here directly
    });

    const compileExitCode = await new Promise((resolve) => {
      compileProcess.on('close', (code) => {
        clearTimeout(compileTimeout);
        resolve(code);
      });
    });

    if (compileKilledByTimeout) {
      compileStderr += (compileStderr ? "\n" : "") + "Compilation timed out after " + (COMPILATION_TIMEOUT_MS/1000) + " seconds.";
    }

    if (compileExitCode !== 0) {
      return res.status(200).json({ output: compileStdout.trim(), error: `Compilation failed:\n${compileStderr}`.trim() });
    }

    // Run the compiled code
    const runProcess = spawn('timeout', ['5s', outputFilePath]); // Using shell timeout for simplicity within container
    
    let runStdout = '';
    let runStderr = '';
    let runKilledByServerTimeout = false;

    const serverSideRunTimeout = setTimeout(() => {
        if (!runProcess.killed) {
            runProcess.kill('SIGKILL');
            runKilledByServerTimeout = true;
        }
    }, EXECUTION_TIMEOUT_MS);

    if (input) {
      runProcess.stdin.write(input);
    }
    runProcess.stdin.end();

    runProcess.stdout.on('data', (data) => { runStdout += data.toString(); });
    runProcess.stderr.on('data', (data) => { runStderr += data.toString(); });
    
    runProcess.on('error', (err) => { // Handle executable spawn errors
      clearTimeout(serverSideRunTimeout);
      console.error(`Execution process spawn error for ${uniqueId}:`, err);
      runStderr += (runStderr ? "\n" : "") + `Failed to start executable: ${err.message}`;
      // No need to resolve promise here as 'close' will still fire
    });

    await new Promise((resolve) => {
      runProcess.on('close', (runExitCode) => {
        clearTimeout(serverSideRunTimeout);
        
        let timeoutMessage = "";
        if (runKilledByServerTimeout) { // Server-side timeout takes precedence
            timeoutMessage = `Execution timed out after ${EXECUTION_TIMEOUT_MS / 1000} seconds (server limit).`;
        } else if (runExitCode === 124) { // Specific exit code from 'timeout' command (sandbox limit)
            timeoutMessage = "Execution timed out after 5 seconds (sandbox limit).";
        }

        if (timeoutMessage) {
            runStderr = runStderr.trim() ? `${runStderr.trim()}\n${timeoutMessage}` : timeoutMessage;
        } else if (runExitCode !== 0 && !runStderr.trim()) {
            // If it failed with a non-zero exit code but produced no stderr, add a generic message
            runStderr = `Execution failed with exit code ${runExitCode}.`;
        } else if (runExitCode !== 0 && runStderr.trim()) {
            // If it failed and there's stderr, ensure it's clean or append exit code if useful
            // runStderr = runStderr.trim() + ` (exit code: ${runExitCode})`; // Optional: append exit code
        }
        resolve(runExitCode);
      });
    });
    
    res.status(200).json({ output: runStdout.trim(), error: (compileStderr + runStderr).trim() });

  } catch (error) {
    console.error(`Server error during C++ execution for ${uniqueId}:`, error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  } finally {
    if (tempDir) {
      fs.rm(tempDir, { recursive: true, force: true }).catch(err => console.error(`Error removing tempDir ${tempDir} for ${uniqueId}:`, err));
    }
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`C++ runner service listening on port ${PORT}`);
});
