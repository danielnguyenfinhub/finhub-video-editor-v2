// Plugin launcher (plain Node, no dependencies). Starts the pre-bundled MCP server at once, and on
// first run installs the studio's render dependencies in the background so the client never times out.
// stdout carries the MCP protocol, so npm output goes to stderr.
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = process.env.STUDIO_DIR || resolve(dirname(fileURLToPath(import.meta.url)), '..');
const win = process.platform === 'win32';
if (!existsSync(join(root, 'node_modules', '.bin', win ? 'tsx.cmd' : 'tsx'))) {
	spawn(win ? 'npm.cmd' : 'npm', ['ci', '--no-audit', '--no-fund'], {cwd: root, stdio: ['ignore', 2, 2], shell: win})
		.on('exit', (code) => console.error(code === 0 ? 'studio dependencies installed' : `npm ci failed (${code}) in ${root}`));
}
const child = spawn(process.execPath, [join(root, 'mcp', 'dist', 'server.mjs'), ...process.argv.slice(2)],
	{cwd: root, stdio: 'inherit', env: {...process.env, STUDIO_DIR: root}});
child.on('exit', (code) => process.exit(code ?? 1));
