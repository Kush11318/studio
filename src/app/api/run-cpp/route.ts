
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import os from 'os';

const EXTERNAL_DOCKER_RUNNER_URL = process.env.EXTERNAL_DOCKER_RUNNER_URL;

export async function POST(req: NextRequest) {
  let tempDir: string | undefined;
  try {
    const body = await req.json();
    const { code, input = '' }: { code: string; input?: string } = body;

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    if (EXTERNAL_DOCKER_RUNNER_URL) {
      console.log(`Using external Docker runner: ${EXTERNAL_DOCKER_RUNNER_URL}`);
      try {
        const externalResponse = await fetch(EXTERNAL_DOCKER_RUNNER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Consider adding authentication headers if your external service requires them
          },
          body: JSON.stringify({ code, input }),
          signal: AbortSignal.timeout(20000), // 20-second timeout for the external request
        });

        if (!externalResponse.ok) {
          let errorDetails = 'No details available from external service.';
          try {
            // Try to get more specific error details from the response body
            errorDetails = await externalResponse.text();
          } catch (parseError) {
            // Ignore if parsing response body fails, keep the generic message
          }
          console.error(`External runner service error: ${externalResponse.status} ${externalResponse.statusText}`, errorDetails);
          return NextResponse.json(
            { error: `External runner service responded with status ${externalResponse.status}.`, details: errorDetails },
            { status: externalResponse.status || 500 }
          );
        }

        const result = await externalResponse.json();
        // Assuming the external service returns a JSON object like { output: string, error: string }
        return NextResponse.json(result, { status: 200 });

      } catch (fetchError: any) {
        console.error('Failed to call external Docker runner service:', fetchError);
        let errorMessage = 'Failed to connect to the external Docker runner service.';
        if (fetchError.name === 'AbortError') {
            errorMessage = 'Request to external Docker runner service timed out (20 seconds).';
        } else if (fetchError instanceof Error) {
            errorMessage = `Error connecting to external service: ${fetchError.message}`;
        }
        return NextResponse.json({ error: errorMessage, details: fetchError.toString() }, { status: 503 }); // 503 Service Unavailable
      }
    } else {
      console.warn('EXTERNAL_DOCKER_RUNNER_URL is not set. Falling back to local Docker execution. Please set this environment variable in .env for your external service.');

      const baseTmpDir = os.tmpdir();
      tempDir = await fs.mkdtemp(path.join(baseTmpDir, 'cpp-runner-'));

      const cppFilePath = path.join(tempDir, 'main.cpp');
      await fs.writeFile(cppFilePath, code);

      const dockerArgs = [
        'run',
        '--rm',
        '-i',
        '--network=none',
        '--memory=256m',
        '--cpus=1',
        `-v`, `${tempDir}:${tempDir}`,
        `-w`, `${tempDir}`,
        'gcc:latest',
        'sh', '-c', 'g++ main.cpp -o main.out -std=c++17 && timeout 5s ./main.out',
      ];

      return new Promise((resolve) => {
        const dockerProcess = spawn('docker', dockerArgs);

        let stdout = '';
        let stderr = '';
        let killedByTimeout = false;

        const processTimeout = setTimeout(() => {
          if (!dockerProcess.killed) {
            dockerProcess.kill('SIGKILL');
            killedByTimeout = true;
            console.error('Local Docker process killed due to Node.js-side timeout (15s)');
          }
        }, 15000);

        dockerProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        dockerProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        dockerProcess.on('error', (err: NodeJS.ErrnoException) => {
          clearTimeout(processTimeout);
          console.error('Failed to start local Docker process:', err);
          const currentTempDir = tempDir;
          if (currentTempDir) {
            fs.rm(currentTempDir, { recursive: true, force: true }).catch(rmErr => console.error(`Error removing tempDir ${currentTempDir} on docker error:`, rmErr));
            tempDir = undefined;
          }
          let errorMessageText = `Failed to start local Docker process: ${err.message}`;
          if (err.code === 'ENOENT') {
            errorMessageText = "Failed to start local Docker process: The 'docker' command was not found. Please ensure Docker is installed and its executable is in your system's PATH environment variable.";
          }
          resolve(NextResponse.json({ output: stdout, error: errorMessageText }, { status: 500 }));
        });

        dockerProcess.on('close', (exitCode) => {
          clearTimeout(processTimeout);
          const currentTempDir = tempDir;
          if (currentTempDir) {
            fs.rm(currentTempDir, { recursive: true, force: true }).catch(rmErr => console.error(`Error removing tempDir ${currentTempDir} on docker close:`, rmErr));
            tempDir = undefined;
          }

          if (killedByTimeout) {
              resolve(NextResponse.json({ output: stdout.trim(), error: (stderr.trim() + "\nExecution timed out after 15 seconds (server limit).").trim() }, { status: 200 }));
          } else if (exitCode !== 0 && stderr.trim()) {
            resolve(NextResponse.json({ output: stdout.trim(), error: stderr.trim() }, { status: 200 }));
          } else {
            resolve(NextResponse.json({ output: stdout.trim(), error: stderr.trim() }, { status: 200 }));
          }
        });

        if (input) {
          dockerProcess.stdin.write(input);
        }
        dockerProcess.stdin.end();
      });
    }
  } catch (error: any) {
    console.error('API Error in run-cpp:', error);
    if (tempDir) {
      const currentTempDir = tempDir; // Capture for async cleanup
      await fs.rm(currentTempDir, { recursive: true, force: true }).catch(rmErr => console.error(`Error removing tempDir ${currentTempDir} in outer catch:`, rmErr));
    }
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}
