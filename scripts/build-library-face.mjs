import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const face = process.argv[2]
if (face !== 'host' && face !== 'client') {
  throw new Error(`build-library-face: expected host or client, got ${JSON.stringify(face)}`)
}

const typeScriptArgs = [resolve(repositoryRoot, 'scripts/build-face-types.mjs'), face]
if (!runStep('TypeScript', typeScriptArgs)) {
  process.exit()
}
if (!runStep('esbuild', [
  '--import',
  'tsx/esm',
  resolve(repositoryRoot, 'scripts/build-esbuild-workspace.ts'),
  face,
])) process.exit()

function runStep(name, args) {
  const maxAttempts = process.platform === 'win32' ? 10 : 1
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = spawnSync(process.execPath, args, {
      cwd: repositoryRoot,
      env: process.env,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      timeout: process.platform === 'win32' ? 120_000 : undefined,
      // Inherit stdin; pipe stdout/stderr. On Windows, a piped child stdin
      // makes spawnSync fail with EBUSY when the parent's own stdio is a pipe
      // (e.g. under CI, git hooks, or captured shells). Inheriting stdin
      // avoids that while keeping stdout/stderr capturable for error handling.
      stdio: ['inherit', 'pipe', 'pipe'],
    })
    if (result.stdout) process.stdout.write(result.stdout)
    if (result.stderr) process.stderr.write(result.stderr)
    if (result.error === undefined && result.status === 0 && result.signal === null) return true

    const timedOut = result.error?.code === 'ETIMEDOUT'
    const windowsStatus = result.status === null ? undefined : result.status >>> 0
    const nativeRuntimeFailure = windowsStatus !== undefined && [
      0xC0000005,
      0x80000003,
      0xC0000374,
      0xC0000409,
    ].includes(windowsStatus)
    const compilerRuntimeFailure = result.status === 1
      && /TypeError:/.test(result.stderr ?? '')
      && /node_modules[\\/]\.pnpm[\\/]typescript@[^\\/]+[\\/]node_modules[\\/]typescript[\\/]lib[\\/]_tsc\.js/.test(result.stderr ?? '')
    const retryable = process.platform === 'win32'
      && (timedOut || nativeRuntimeFailure || compilerRuntimeFailure)
    console.error(
      `build-library-face: ${name} failed: status=${String(result.status)} signal=${String(result.signal)} timedOut=${String(timedOut)}`,
    )
    if (!retryable || attempt === maxAttempts) {
      process.exitCode = result.status ?? 1
      return false
    }
    console.warn(`build-library-face: retry ${name} (${attempt}/${maxAttempts})`)
  }
  return false
}
