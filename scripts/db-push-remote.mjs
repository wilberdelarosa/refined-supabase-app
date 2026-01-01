import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

function loadDotEnvFile(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const key = match[1];
      let value = match[2] ?? '';
      value = value.trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

function resolveSupabaseCli() {
  const explicit = process.env.SUPABASE_CLI_PATH;
  if (explicit) return explicit;

  const scoopDefault = path.join(process.env.USERPROFILE ?? 'C:\\Users\\wilbe', 'scoop', 'shims', 'supabase.exe');
  if (fs.existsSync(scoopDefault)) return scoopDefault;

  return 'supabase';
}

function parseArgs(argv) {
  const out = { dryRun: false, dbUrl: undefined, dbPassword: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--db-url') out.dbUrl = argv[++i];
    else if (a === '--password') out.dbPassword = argv[++i];
  }
  return out;
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function promptHidden(question) {
  // Minimal hidden-input prompt (no echo). Works in typical terminals.
  const stdin = process.stdin;
  const stdout = process.stdout;

  if (!stdin.isTTY) {
    // Fallback: visible prompt if no TTY
    return await prompt(question);
  }

  stdout.write(question);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  let value = '';

  return await new Promise((resolve) => {
    function onData(ch) {
      // Enter
      if (ch === '\r' || ch === '\n') {
        stdout.write('\n');
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        resolve(value);
        return;
      }

      // Ctrl+C
      if (ch === '\u0003') {
        stdout.write('\n');
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.exit(130);
      }

      // Backspace
      if (ch === '\u007f') {
        value = value.slice(0, -1);
        return;
      }

      value += ch;
    }

    stdin.on('data', onData);
  });
}

function usageAndExit(message) {
  if (message) console.error(message);
  console.error('\nRequired env vars (do NOT commit these):');
  console.error('- SUPABASE_DB_URL (without password), e.g. postgresql://postgres@db.<ref>.supabase.co:5432/postgres');
  console.error('- SUPABASE_DB_PASSWORD (database password)');
  console.error('\nAlternatively, you can omit SUPABASE_DB_PASSWORD and the script will prompt for it without echoing.');
  console.error('\nExample (PowerShell):');
  console.error('$env:SUPABASE_DB_URL = "postgresql://postgres@db.xuhvlomytegdbifziilf.supabase.co:5432/postgres"');
  console.error('$env:SUPABASE_DB_PASSWORD = "<your-db-password>"');
  console.error('npm run db:push-remote -- --dry-run');
  process.exit(1);
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const dryRun = parsed.dryRun;

  // load local env files if present (safe for local use)
  const cwd = process.cwd();
  loadDotEnvFile(path.join(cwd, '.env.local'));
  loadDotEnvFile(path.join(cwd, '.env'));

  let dbUrl = parsed.dbUrl ?? process.env.SUPABASE_DB_URL;
  let dbPassword = parsed.dbPassword ?? process.env.SUPABASE_DB_PASSWORD;

  if (!dbUrl) {
    dbUrl = (await prompt('SUPABASE_DB_URL (no password): ')).trim();
  }

  if (!dbPassword) {
    dbPassword = (await promptHidden('SUPABASE_DB_PASSWORD: ')).trim();
  }

  if (!dbUrl) usageAndExit('Missing SUPABASE_DB_URL');
  if (!dbPassword) usageAndExit('Missing SUPABASE_DB_PASSWORD');

  const supabaseCli = resolveSupabaseCli();

  const cmdArgs = [
    'db',
    'push',
    '--db-url',
    dbUrl,
    '--password',
    dbPassword,
    '--yes',
  ];

  if (dryRun) cmdArgs.push('--dry-run');

  const result = spawnSync(supabaseCli, cmdArgs, {
    stdio: 'inherit',
    shell: false,
  });

  process.exit(result.status ?? 1);
}

await main();
