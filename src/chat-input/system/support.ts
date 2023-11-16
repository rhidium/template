import { SlashCommandBuilder } from 'discord.js';
import { ChatInputCommand, CommandCooldownType, UnitConstants } from '@rhidium/core';
import { appConfig } from '@/config';

const SupportCommand = new ChatInputCommand({
  data: new SlashCommandBuilder()
    .setDescription('Receive support for the bot'),
  cooldown: {
    type: CommandCooldownType.Channel,
    usages: 1,
    duration: 30 * UnitConstants.MS_IN_ONE_SECOND,
  },
  run: async (client, interaction) => {
    if (!appConfig.urls?.support_server) {
      await SupportCommand.reply(interaction, client.embeds.error(
        'The support server URL is currently not available, please try again later',
      ));
      return;
    }

    await SupportCommand.reply(interaction, client.embeds.branding({
      description: [
        'If you need help with the bot, have any questions or feature requests, you can join the ',
        `[support server](${
          appConfig.urls.support_server
        }) and ask in the appropriate channel.`,
      ].join(''),
    }));
  },
});

export default SupportCommand;
