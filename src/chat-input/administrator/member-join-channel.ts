import { guildSettingsFromCache, updateGuildSettings } from '@/database';
import { LoggingServices } from '@/services';
import { ChannelType, SlashCommandBuilder } from 'discord.js';
import { ChatInputCommand, InteractionUtils, PermLevel } from '@rhidium/core';

const MemberJoinChannelCommand = new ChatInputCommand({
  permLevel: PermLevel.Administrator,
  isEphemeral: true,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setDescription('Set the channel to send member join messages to')
    .addChannelOption((option) => option
      .setName('channel')
      .setDescription('The channel to send member join messages to')
      .setRequired(false)
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .addBooleanOption((option) => option
      .setName('disable')
      .setDescription('Disable member join messages')
      .setRequired(false),
    ),
  run: async (client, interaction) => {
    const { options } = interaction;
    const channel = options.getChannel('channel');
    const disable = options.getBoolean('disable') ?? false;

    const guildAvailable = InteractionUtils.requireAvailableGuild(client, interaction);
    if (!guildAvailable) return;

    await MemberJoinChannelCommand.deferReplyInternal(interaction);

    const guildSettings = await guildSettingsFromCache(interaction.guildId);
    if (!guildSettings) {
      MemberJoinChannelCommand.reply(
        interaction,
        client.embeds.error('Guild settings not found, please try again later'),
      );
      return;
    }

    if (disable) {
      guildSettings.memberJoinChannelId = null;
      await updateGuildSettings(guildSettings, {
        data: { memberJoinChannelId: null },
      });
      MemberJoinChannelCommand.reply(
        interaction,
        client.embeds.success('Member join messages disabled'),
      );
      LoggingServices.adminLog(
        interaction.guild,
        client.embeds.info({
          title: 'Member Join Messages Disabled',
          description: `Member join messages have been disabled by ${interaction.user}`,
        }),
      );
      return;
    }

    if (!channel) {
      MemberJoinChannelCommand.reply(
        interaction,
        client.embeds.branding({
          fields: [{
            name: 'Member Join Channel',
            value: guildSettings.memberJoinChannelId
              ? `<#${guildSettings.memberJoinChannelId}>`
              : 'Not set',
          }],
        })
      );
      return;
    }

    guildSettings.memberJoinChannelId = channel.id;
    await updateGuildSettings(guildSettings, {
      data: { memberJoinChannelId: channel.id },
    });
    MemberJoinChannelCommand.reply(
      interaction,
      client.embeds.success(`Member join channel set to ${channel}`),
    );
    LoggingServices.adminLog(
      interaction.guild,
      client.embeds.info({
        title: 'Member Join Channel Changed',
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

export default MemberJoinChannelCommand;
