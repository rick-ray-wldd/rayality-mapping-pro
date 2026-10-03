import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
let output = 'Third-party packages in the production dependency tree, plus Tailwind CSS used in the generated stylesheet.\nGenerated from package-lock.json; regenerate after npm ci when dependencies change.\n\n';
for (const [path, pkg] of Object.entries(lock.packages)) {
  if (!path || (pkg.dev && path !== 'node_modules/tailwindcss')) continue;
  output += `\n${'='.repeat(72)}\n${path} @ ${pkg.version} — ${pkg.license || 'see package notice'}\n`;
  for (const name of readdirSync(path).filter(name => /^(license|licence|notice|copying)(\.|$|-)/i.test(name))) {
    try { output += `\n${name}\n${readFileSync(join(path, name), 'utf8')}\n`; } catch { /* directory */ }
  }
}
writeFileSync('public/third-party.txt', output.split('\n').map(line => line.trimEnd()).join('\n').trimEnd() + '\n');
