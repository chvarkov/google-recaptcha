// Resolves the npm dist-tag for the version from package.json.
//
// Usage: node release-info.mjs <version> [<current latest version>]
//   4.0.0         -> tag=latest (or v<major>-latest if older than current latest)
//   4.0.0-alpha.1 -> tag=alpha  (prerelease never becomes `latest`)
//   4.0.0-rc.2    -> tag=rc
//
// Prints `version=...` and `tag=...` lines (GITHUB_OUTPUT format). Exits with 1 on invalid version.

import console from 'node:console';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

// X.Y.Z or X.Y.Z-<prerelease>, without build metadata.
const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

export function resolveRelease(version, currentLatest) {
	const match = VERSION_PATTERN.exec(version);

	if (!match) {
		throw new Error(`Invalid package version '${version}'. Expected X.Y.Z or X.Y.Z-<prerelease> (e.g. 4.0.0-alpha.1).`);
	}

	const core = match.slice(1, 4).map(Number);
	const prerelease = match[4];

	if (prerelease) {
		// `4.0.0-alpha.1` -> `alpha`; purely numeric prerelease (`4.0.0-1`) -> `next`.
		const id = prerelease.split('.')[0];
		return { version, tag: /^\d+$/.test(id) ? 'next' : id.toLowerCase() };
	}

	// Publishing a patch for an older major/minor must not move `latest` back.
	const isNewest = !currentLatest || compareCore(core, parseCore(currentLatest)) > 0;

	return { version, tag: isNewest ? 'latest' : `v${core[0]}-latest` };
}

function parseCore(version) {
	const core = /^(\d+)\.(\d+)\.(\d+)/.exec(version);

	if (!core) {
		throw new Error(`Invalid current latest version '${version}'`);
	}

	return core.slice(1).map(Number);
}

function compareCore(a, b) {
	for (let i = 0; i < 3; i++) {
		if (a[i] !== b[i]) {
			return a[i] - b[i];
		}
	}

	return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const [version, currentLatest] = process.argv.slice(2);

	try {
		const { tag } = resolveRelease(version ?? '', currentLatest || undefined);
		console.log(`version=${version}`);
		console.log(`tag=${tag}`);
	} catch (e) {
		console.error(e.message);
		process.exit(1);
	}
}
