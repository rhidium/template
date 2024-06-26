import { stripIndents } from 'common-tags';
import { AppConfig } from '.';
import { PortConstants } from '@/enums/ports';
import { logger } from '@rhidium/core';

/**
 * Validates the resolved `appConfig`, warning users when
 * necessary, and existing if we can't operate due to bad configuration
 */
export const validateConfig = (appConfig: AppConfig) => {
  if (appConfig.api.port !== null) {
    if (
      typeof appConfig.api.port !== 'number' ||
      appConfig.api.port < 0 ||
      appConfig.api.port > PortConstants.VALID_PORT_RANGE_MAX
    ) {
      logger._warn(stripIndents`
        [Configuration] "api#port" is not in range 0-${PortConstants.VALID_PORT_RANGE_MAX}
      `);
      process.exit(1);
    }

    if (appConfig.api.port <= PortConstants.WELL_KNOWN_PORT_RANGE) {
      logger._warn(stripIndents`
        [Configuration] "api#port" is in the reserved well-known port range of 0-${PortConstants.WELL_KNOWN_PORT_RANGE}
      `);
    }

    if (appConfig.api.port >= PortConstants.EPHEMERAL_PORT_RANGE_START) {
      logger._warn(stripIndents`
        [Configuration] "api#port" is in the reserved ephemeral port range of 0-${PortConstants.WELL_KNOWN_PORT_RANGE}
      `);
    }
  }
};
