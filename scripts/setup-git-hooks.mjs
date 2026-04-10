import { execSync } from 'node:child_process';

const HOOKS_PATH = '.githooks';

try {
  execSync(`git config core.hooksPath ${HOOKS_PATH}`, { stdio: 'inherit' });
  console.log(`[setup-git-hooks] Set core.hooksPath to ${HOOKS_PATH}`);
} catch (error) {
  console.warn(
    '[setup-git-hooks] Could not set core.hooksPath automatically. ' +
      'Run `git config core.hooksPath .githooks` once per environment.',
  );
}
