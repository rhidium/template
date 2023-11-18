import { guildSettingsFromCache, updateGuildSettings } from '@/database';
import { LoggingServices } from '@/services';
import { ChannelType, SlashCommandBuilder } from 'discord.js';
import { ChatInputCommand, InteractionUtils, PermLevel } from '@rhidium/core';
import Lang from '@/i18n/i18n';

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
        client.embeds.error(Lang.t('general:settings.notFound')),
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
        client.embeds.success(Lang.t('commands:memberJoinChannel.disabled')),
      );
      LoggingServices.adminLog(
        interaction.guild,
        client.embeds.info({
          title: Lang.t('commands:memberJoinChannel.disabledTitle'),
          description: Lang.t('commands:memberJoinChannel.disabledBy', {
            username: interaction.user.username,
          }),
        }),
      );
      return;
    }

    if (!channel) {
      MemberJoinChannelCommand.reply(
        interaction,
        client.embeds.branding({
          fields: [{
            name: Lang.t('commands:memberJoinChannel.title'),
            value: guildSettings.memberJoinChannelId
              ? `<#${guildSettings.memberJoinChannelId}>`
              : Lang.t('general:notSet'),
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
      client.embeds.success(Lang.t('commands:memberJoinChannel.changed', {
        channel: channel.toString(),
      })),
    );
    LoggingServices.adminLog(
      interaction.guild,
      client.embeds.info({
        title: Lang.t('commands:memberJoinChannel.changedTitle'),
        fields: [{
          name: Lang.t('general:channel'),
          value: `<#${channel.id}>`,
          inline: true,
        }, {
          name: Lang.t('general:member'),
          value: interaction.user.toString(),
          inline: true,
        }],
      }),
    );
    return;
  },
});

export default MemberJoinChannelCommand;
