import { options } from './arguments';

export function debug(message: string): void {
  if (!options.verbose) {
    return;
  }

  console.log(`JIRA prepare commit msg > DEBUG: ${message}`);
}

export function log(message: string): void {
  console.log(`JIRA prepare commit msg > ${message}`);
}

export function error(err: string): void {
  console.error(`JIRA prepare commit msg > ${err}`);
}
