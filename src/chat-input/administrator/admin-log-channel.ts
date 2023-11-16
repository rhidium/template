import { guildSettingsFromCache, updateGuildSettings } from '@/database';
import { LoggingServices } from '@/services';
import { ChannelType, SlashCommandBuilder } from 'discord.js';
import { ChatInputCommand, InteractionUtils, PermLevel } from '@rhidium/core';

const AdminLogChannelCommand = new ChatInputCommand({
  permLevel: PermLevel.Administrator,
  isEphemeral: true,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setDescription('Set the channel to send admin log (audit) messages to')
    .addChannelOption((option) => option
      .setName('channel')
      .setDescription('The channel to send admin log (audit) messages to')
      .setRequired(false)
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .addBooleanOption((option) => option
      .setName('disable')
      .setDescription('Disable admin log messages')
      .setRequired(false),
    ),
  run: async (client, interaction) => {
    const { options } = interaction;
    const channel = options.getChannel('channel');
    const disable = options.getBoolean('disable') ?? false;

    const guildAvailable = InteractionUtils.requireAvailableGuild(client, interaction);
    if (!guildAvailable) return;

    await AdminLogChannelCommand.deferReplyInternal(interaction);

    const guildSettings = await guildSettingsFromCache(interaction.guildId);
    if (!guildSettings) {
      AdminLogChannelCommand.reply(
        interaction,
        client.embeds.error('Guild settings not found, please try again later'),
      );
      return;
    }

    if (disable) {
      guildSettings.adminLogChannelId = null;
      await updateGuildSettings(guildSettings, {
        data: { adminLogChannelId: null },
      });
      AdminLogChannelCommand.reply(
        interaction,
        client.embeds.success('Admin logging disabled'),
      );
      LoggingServices.adminLog(
        interaction.guild,
        client.embeds.info({
          title: 'Admin Logging Disabled',
          description: `Admin logging has been disabled by ${interaction.user}`,
        }),
      );
      return;
    }

    if (!channel) {
      AdminLogChannelCommand.reply(
        interaction,
        client.embeds.branding({
          fields: [{
            name: 'Admin Logging Channel',
            value: guildSettings.adminLogChannelId
              ? `<#${guildSettings.adminLogChannelId}>`
              : 'Not set',
          }],
        })
      );
      return;
    }

    guildSettings.adminLogChannelId = channel.id;
    await updateGuildSettings(guildSettings, {
      data: { adminLogChannelId: channel.id },
    });
    AdminLogChannelCommand.reply(
      interaction,
      client.embeds.success(`Admin logging channel set to ${channel}`),
    );
    LoggingServices.adminLog(
      interaction.guild,
      client.embeds.info({
        title: 'Admin Logging Channel Changed',
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

export default AdminLogChannelCommand;
