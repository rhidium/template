import Lang from 'i18next';

import enClient from '../../locales/en/client.json';
import enCommands from '../../locales/en/commands.json';
import nlClient from '../../locales/nl/client.json';
import nlCommands from '../../locales/nl/commands.json';

export const defaultNS = 'client';

export const init = (debugEnabled = false) =>
  Lang.init({
    debug: debugEnabled,
    fallbackLng: 'en',
    defaultNS,
    resources: {
      en: {
        client: enClient,
        commands: enCommands,
      },
      nl: {
        client: nlClient,
        commands: nlCommands,
      },
    },
  });

export default Lang;
