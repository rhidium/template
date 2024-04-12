import { existsSync, readFileSync } from 'fs';
import { UserConfigOptions } from '.';
import { logger } from '@rhidium/core';

const configFileExists = existsSync('./config/config.json');

// [DEV] - Consider cli argument to force config.example.json
// to be used instead of config.json for Docker builds etc.
if (!configFileExists) {
  logger._warn([
    './config/config.json does not exist, did you forget to create it?',
    'You can use our web-based editor to create a new one',
    'and configure it: `pnpm config-editor` - falling back',
    'to ./config/config.example.json - this will NOT start your bot!',
  ].join(' '));
}

const configData = configFileExists
  ? readFileSync('./config/config.json', 'utf8')
  : readFileSync('./config/config.example.json', 'utf8');
const userConfig = JSON.parse(configData) as UserConfigOptions;

export default userConfig;

export * from './internal-config';
export * from './types';
