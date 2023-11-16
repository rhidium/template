import { guildSettingsFromCache, updateGuildSettings } from '@/database';
import { LoggingServices } from '@/services';
import { SlashCommandBuilder } from 'discord.js';
import { ChatInputCommand, InteractionUtils, PermLevel } from '@rhidium/core';

const ModRoleCommand = new ChatInputCommand({
  permLevel: PermLevel.Administrator,
  isEphemeral: true,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setDescription('Set the role that determines who can use Moderator commands')
    .addRoleOption((option) => option
      .setName('role')
      .setDescription('The role that should be able to use Moderator commands')
      .setRequired(false)
    )
    .addBooleanOption((option) => option
      .setName('remove')
      .setDescription('Remove the Moderator role')
      .setRequired(false),
    ),
  run: async (client, interaction) => {
    const { options } = interaction;
    const role = options.getRole('role');
    const remove = options.getBoolean('remove') ?? false;

    const guildAvailable = InteractionUtils.requireAvailableGuild(client, interaction);
    if (!guildAvailable) return;

    await ModRoleCommand.deferReplyInternal(interaction);

    const guildSettings = await guildSettingsFromCache(interaction.guildId);
    if (!guildSettings) {
      ModRoleCommand.reply(
        interaction,
        client.embeds.error('Guild settings not found, please try again later'),
      );
      return;
    }

    if (remove) {
      guildSettings.modRoleId = null;
      await updateGuildSettings(guildSettings, {
        data: { modRoleId: null },
      });
      ModRoleCommand.reply(
        interaction,
        client.embeds.success('Moderator role removed/unset'),
      );
      LoggingServices.adminLog(
        interaction.guild,
        client.embeds.info({
          title: 'Moderator Role Removed',
          description: `The Moderator role has been removed by ${interaction.user}`,
        }),
      );
      return;
    }

    if (!role) {
      ModRoleCommand.reply(
        interaction,
        client.embeds.branding({
          fields: [{
            name: 'Moderator Role',
            value: guildSettings.modRoleId
              ? `<@&${guildSettings.modRoleId}>`
              : 'Not set',
          }],
        })
      );
      return;
    }

    guildSettings.modRoleId = role.id;
    await updateGuildSettings(guildSettings, {
      data: { modRoleId: role.id },
    });
    ModRoleCommand.reply(
      interaction,
      client.embeds.success(`Moderator role changed to ${role}`),
    );
    LoggingServices.adminLog(
      interaction.guild,
      client.embeds.info({
        title: 'Moderator Role Changed',
        fields: [{
          name: 'Role',
          value: `<@&${role.id}>`,
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

export default ModRoleCommand;
