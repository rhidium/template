import { guildSettingsFromCache, updateGuildSettings } from '@/database';
import { LoggingServices } from '@/services';
import { ChannelType, SlashCommandBuilder } from 'discord.js';
import { ChatInputCommand, InteractionUtils, PermLevel } from '@rhidium/core';

const ModLogChannelCommand = new ChatInputCommand({
  permLevel: PermLevel.Administrator,
  isEphemeral: true,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setDescription('Set the channel to send moderator log messages to')
    .addChannelOption((option) => option
      .setName('channel')
      .setDescription('The channel to send moderator log messages to')
      .setRequired(false)
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .addBooleanOption((option) => option
      .setName('disable')
      .setDescription('Disable moderator log messages')
      .setRequired(false),
    ),
  run: async (client, interaction) => {
    const { options } = interaction;
    const channel = options.getChannel('channel');
    const disable = options.getBoolean('disable') ?? false;

    const guildAvailable = InteractionUtils.requireAvailableGuild(client, interaction);
    if (!guildAvailable) return;

    await ModLogChannelCommand.deferReplyInternal(interaction);

    const guildSettings = await guildSettingsFromCache(interaction.guildId);
    if (!guildSettings) {
      ModLogChannelCommand.reply(
        interaction,
        client.embeds.error('Guild settings not found, please try again later'),
      );
      return;
    }

    if (disable) {
      guildSettings.modLogChannelId = null;
      await updateGuildSettings(guildSettings, {
        data: { modLogChannelId: null },
      });
      ModLogChannelCommand.reply(
        interaction,
        client.embeds.success('Moderator logging disabled'),
      );
      LoggingServices.adminLog(
        interaction.guild,
        client.embeds.info({
          title: 'Moderator Logging Disabled',
          description: `Moderator logging has been disabled by ${interaction.user}`,
        }),
      );
      return;
    }

    if (!channel) {
      ModLogChannelCommand.reply(
        interaction,
        client.embeds.branding({
          fields: [{
            name: 'Moderator Logging Channel',
            value: guildSettings.modLogChannelId
              ? `<#${guildSettings.modLogChannelId}>`
              : 'Not set',
          }],
        })
      );
      return;
    }

    guildSettings.modLogChannelId = channel.id;
    await updateGuildSettings(guildSettings, {
      data: { modLogChannelId: channel.id },
    });
    ModLogChannelCommand.reply(
      interaction,
      client.embeds.success(`Moderator logging channel set to ${channel}`),
    );
    LoggingServices.adminLog(
      interaction.guild,
      client.embeds.info({
        title: 'Moderator Logging Channel Changed',
        fields: [{
          name: 'Channel',
          value: `<#${channel.id}>`,
          inline: true,
        }, {
          name: 'Member',
          value: interaction.user.toString(),
          inline: true,
        }],
      }),
    );
    return;
  },
});

export default ModLogChannelCommand;
