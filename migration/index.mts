// Orchestrates export -> transform -> import -> validate as one scripted run for the
// maintenance window. Each step runs in its own process (so `process.exit()` inside a step
// doesn't kill the orchestrator) and the run stops immediately, with a clear message, if any
// step fails — no partial "looks done" state.
import { spawnSync } from 'child_process'

function run(label: string, file: string) {
  console.log(`\n=== ${label} ===`)
  const result = spawnSync('node', ['--import', 'tsx', file], { stdio: 'inherit', env: process.env })
  if (result.status !== 0) {
    console.error(`\n${label} failed (exit code ${result.status}). Stopping — fix the issue and re-run.`)
    process.exit(result.status ?? 1)
  }
}

run('1. Export from MongoDB', 'migration/exportMongo.mts')
run('2. Transform', 'migration/transform.mts')
run('3. Import into Payload/Postgres', 'migration/importPayload.mts')
run('4. Validate', 'migration/validate.mts')

console.log('\nMigration run complete — all steps passed.')
