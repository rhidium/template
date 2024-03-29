import './shared';

import { ClusterClient, getInfo } from 'discord-hybrid-sharding';
import { GatewayIntentBits } from 'discord.js';
import path from 'path';
import Lang from './i18n/i18n';
import { Client, GlobalMiddlewareOptions, logger, initializeLocalization  } from '@rhidium/core';
import { permConfig } from './permissions';
import { appConfig } from './config';
import { locales } from './i18n';
import pkg from '../package.json';
import { processUsageStatisticsMiddleware } from './middleware/process-usage-statictics';
import { persistentCooldownMiddleware } from './middleware/persistent-cooldown';
import { clientExtensions } from './extensions';

/**
 * This is our client/bot file - it's not the entry point of our application,
 * but it's the entry point of our bot.
 * This file is spawned by the cluster manager, and is responsible for
 * initializing our client, and logging in to Discord.
 * Since we're using discord-hybrid-sharding, this file will be spawned
 * multiple times, depending on the number of shards we're using.
 * We should perform required initialization here (but also in our cluster).
 */

export const main = async () => {
  // Timestamp log start
  logger._info(Lang.t('client:initialize.start'));
  const startInitialing = process.hrtime();

  // Initialize our client - scoped because of clustering
  // It looks like a lot boilerplate, but we only have few
  // required options and can opt-into a lot of powerful features
  const client = new Client({
    suppressVanity: false,
    globalMiddleware,
    token: appConfig.client.token,
    intents: [GatewayIntentBits.Guilds],
    extensions: clientExtensions,
    applicationId: appConfig.client.id,
    errorChannelId: appConfig.client.error_channel_id ?? null,
    commandUsageChannelId: appConfig.client.command_usage_channel_id ?? null,
    developmentServerId: appConfig.client.development_server_id,
    shards: appConfig.cluster.enabled ? getInfo()?.SHARD_LIST ?? 'auto' : 'auto',
    shardCount: appConfig.cluster.enabled ? getInfo()?.TOTAL_SHARDS ?? 1 : 1,
    internalPermissions: clientPermissions!,
    debug: clientDebugging!,
    directories: clientDirectories!,
    logging: clientLoggingConfig!,
    colors: appConfig.colors,
    emojis: appConfig.emojis,
    I18N: Lang,
    locales,
    pkg,
  });

  // Let's initialize the library language localization
  initializeLocalization(Lang);

  // Initialize our cluster if we're using one
  if (appConfig.cluster.enabled) client.cluster = new ClusterClient(client);

  // Timestamp log finished initializing
  const endInitializing = client.logger.consoleExecutionTime(startInitialing);
  client.logger.success(
    Lang.t('client:initialize.success', {
      commandSize: client.commandManager.commandSize,
      duration: endInitializing,
    }),
  );

  // Log in to our client
  await client.login(appConfig.client.token);
};

export const globalMiddleware: GlobalMiddlewareOptions = {
  postRunExecution: [
    processUsageStatisticsMiddleware,
  ],
  preRunThrottle: [
    persistentCooldownMiddleware,
  ],
};

export const clientLoggingConfig: Client['extendedOptions']['logging'] = {
  directory: appConfig.logging?.directory,
  maxFiles: appConfig.logging?.max_files,
  maxSize: appConfig.logging?.max_size,
  datePattern: appConfig.logging?.date_pattern,
  zippedArchive: appConfig.logging?.zipped_archive,
  combinedLogging: appConfig.logging?.combined_logging,
  errorLogging: appConfig.logging?.error_logging,
  warnLogging: appConfig.logging?.warn_logging,
  infoLogging: appConfig.logging?.info_logging,
  httpLogging: appConfig.logging?.http_logging,
  verboseLogging: appConfig.logging?.verbose_logging,
  debugLogging: appConfig.logging?.debug_logging,
  sillyLogging: appConfig.logging?.silly_logging,
};

export const clientPermissions: Client['extendedOptions']['internalPermissions'] = {
  ownerId: appConfig.permissions.owner_id,
  systemAdministrators: appConfig.permissions.system_administrator_ids,
  developers: appConfig.permissions.developer_ids,
  permConfig: permConfig,
};

export const clientDirectories: Client['extendedOptions']['directories'] = {
  listeners: [path.resolve(__dirname, './listeners')],
  autoCompletes: [path.resolve(__dirname, './auto-completes')],
  chatInputs: [path.resolve(__dirname, './chat-input')],
  messageContextMenus: [path.resolve(__dirname, './message-context')],
  userContextMenus: [path.resolve(__dirname, './user-context')],
  componentCommands: [
    path.resolve(__dirname, './buttons'),
    path.resolve(__dirname, './modals'),
    path.resolve(__dirname, './select-menus'),
  ],
  jobs: [path.resolve(__dirname, './jobs')],
};

export const clientDebugging: Client['extendedOptions']['debug'] = {
  enabled: appConfig.debug.debug_mode_enabled,
  commandData: appConfig.debug.command_data,
};

// If we're initializing a shard, run main
const args = process.argv.slice(2);
const initializeShard = args.some((arg) => arg.startsWith('--INITIALIZE='));
if (initializeShard) main();
