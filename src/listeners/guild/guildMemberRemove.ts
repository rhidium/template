import { embedFromEmbedModel } from '@/chat-input/administrator/embeds/helpers';
import { guildSettingsFromCache } from '@/database';
import { buildDiscordPlaceholders, replacePlaceholders, replacePlaceholdersAcrossEmbed } from '@/placeholders';
import { LoggingServices } from '@/services';
import { EmbedBuilder, Events, PermissionFlagsBits } from 'discord.js';
import { ClientEventListener, PermissionUtils, TimeUtils } from '@rhidium/core';

const requiredPermissions = [
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
];

export default new ClientEventListener({
  event: Events.GuildMemberRemove,
  run: async (client, member) => {
    const { logger } = client;
    const { guild } = member;

    const guildSettings = await guildSettingsFromCache(guild.id);
    if (!guildSettings || !guildSettings.memberLeaveChannelId) return;

    const channel = guild.channels.cache.get(guildSettings.memberLeaveChannelId);
    if (!channel) {
      LoggingServices.adminLog(
        guild,
        client.embeds.error({
          title: 'Member Leave Message Error',
          description: `No channel found with ID ${guildSettings.memberLeaveChannelId}`,
        }),
      );
      return;
    }

    if (!channel.permissionsFor(client.user.id)?.has(requiredPermissions)) {
      LoggingServices.adminLog(
        guild,
        client.embeds.error({
          title: 'Member Leave Message Error',
          description: `No permissions to send member leave message in specified channel ${channel}, `
            + `missing: permissions: ${PermissionUtils.bigIntPermOutput(
              requiredPermissions.filter((permission) => !channel.permissionsFor(client.user.id)?.has(permission))
            )}`,
        }),
      );
      return;
    }

    if (!channel.isTextBased()) {
      LoggingServices.adminLog(
        guild,
        client.embeds.error({
          title: 'Member Leave Message Error',
          description: `Channel ${channel} is not text-based`,
        }),
      );
      return;
    }

    const accountCreatedOutput = TimeUtils.discordInfoTimestamp(member.user.createdTimestamp);
    const joinedAtOutput = member.joinedTimestamp
      ? TimeUtils.discordInfoTimestamp(member.joinedTimestamp)
      : 'Unknown';
    const { memberLeaveEmbed } = guildSettings;
    const baseEmbed = new EmbedBuilder()
      .setColor(client.colors.primary)
      .setAuthor({
        name: member.user.username,
        iconURL: member.user.displayAvatarURL({ forceStatic: false }),
      })
      .setTitle('Member Left')
      .setDescription(`${member.user} has left ${guild.name}`)
      .setThumbnail(member.user.displayAvatarURL({ forceStatic: false }))
      .addFields({
        name: 'Account Created',
        value: accountCreatedOutput,
        inline: true,
      }, {
        name: 'Joined At',
        value: joinedAtOutput,
        inline: true,
      }, {
        name: 'Member Count',
        value: guild.memberCount.toLocaleString(),
        inline: true,
      });

    const rawEmbed = embedFromEmbedModel(memberLeaveEmbed, baseEmbed);
    const placeholders = buildDiscordPlaceholders(
      channel,
      guild,
      member,
      member.user
    );
    const embed = replacePlaceholdersAcrossEmbed(rawEmbed, placeholders);
    const resolvedMessage = guildSettings.memberJoinEmbed?.messageText
      ? replacePlaceholders(guildSettings.memberJoinEmbed.messageText, placeholders)
      : '';

    channel.send({ content: resolvedMessage, embeds: [embed] })
      .catch((error) => {
        logger.error('Error encountered while sending member leave message, after checking permissions', error);
        LoggingServices.adminLog(
          guild,
          client.embeds.error({
            title: 'Member Leave Message Error',
            description: 'An error occurred while sending the member leave message, please try again later,'
              + ' the developers have been notified of this error',
          }),
        );
      });
  },
});
