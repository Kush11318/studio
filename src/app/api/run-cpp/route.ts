
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import os from 'os';

export async function POST(req: NextRequest) {
  let tempDir: string | undefined;
  try {
    const body = await req.json();
    const { code, input = '' }: { code: string; input?: string } = body;

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

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
          console.error('Docker process killed due to Node.js-side timeout (15s)');
        }
      }, 15000); // 15 seconds for the whole docker run command

      dockerProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      dockerProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      dockerProcess.on('error', (err: NodeJS.ErrnoException) => {
        clearTimeout(processTimeout);
        console.error('Failed to start Docker process:', err);
        if (tempDir) {
          fs.rm(tempDir, { recursive: true, force: true }).catch(console.error);
        }
        let errorMessage = `Failed to start Docker process: ${err.message}`;
        if (err.code === 'ENOENT') {
          errorMessage = "Failed to start Docker process: The 'docker' command was not found. Please ensure Docker is installed and its executable is in your system's PATH environment variable.";
        }
        resolve(NextResponse.json({ output: stdout, error: errorMessage }, { status: 500 }));
      });

      dockerProcess.on('close', (exitCode) => {
        clearTimeout(processTimeout);
        if (tempDir) {
          fs.rm(tempDir, { recursive: true, force: true }).catch(console.error);
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

  } catch (error: any) {
    console.error('API Error in run-cpp:', error);
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(console.error);
    }
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}
