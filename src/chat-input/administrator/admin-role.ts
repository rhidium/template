import { guildSettingsFromCache, updateGuildSettings } from '@/database';
import { LoggingServices } from '@/services';
import { SlashCommandBuilder } from 'discord.js';
import { ChatInputCommand, InteractionUtils, PermLevel } from '@rhidium/core';

const AdministratorRoleCommand = new ChatInputCommand({
  permLevel: PermLevel.Administrator,
  isEphemeral: true,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setDescription('Set the role that determines who can use Administrator commands')
    .addRoleOption((option) => option
      .setName('role')
      .setDescription('The role that should be able to use Administrator commands')
      .setRequired(false)
    )
    .addBooleanOption((option) => option
      .setName('remove')
      .setDescription('Remove the Administrator role')
      .setRequired(false),
    ),
  run: async (client, interaction) => {
    const { options } = interaction;
    const role = options.getRole('role');
    const remove = options.getBoolean('remove') ?? false;

    const guildAvailable = InteractionUtils.requireAvailableGuild(client, interaction);
    if (!guildAvailable) return;

    await AdministratorRoleCommand.deferReplyInternal(interaction);

    const guildSettings = await guildSettingsFromCache(interaction.guildId);
    if (!guildSettings) {
      AdministratorRoleCommand.reply(
        interaction,
        client.embeds.error('Guild settings not found, please try again later'),
      );
      return;
    }

    if (remove) {
      guildSettings.adminRoleId = null;
      await updateGuildSettings(guildSettings, {
        data: { adminRoleId: null },
      });
      AdministratorRoleCommand.reply(
        interaction,
        client.embeds.success('Administrator role removed/unset'),
      );
      LoggingServices.adminLog(
        interaction.guild,
        client.embeds.info({
          title: 'Administrator Role Removed',
          description: `The Administrator role has been removed by ${interaction.user}`,
        }),
      );
      return;
    }

    if (!role) {
      AdministratorRoleCommand.reply(
        interaction,
        client.embeds.branding({
          fields: [{
            name: 'Administrator Role',
            value: guildSettings.adminRoleId
              ? `<@&${guildSettings.adminRoleId}>`
              : 'Not set',
          }],
        })
      );
      return;
    }

    guildSettings.adminRoleId = role.id;
    await updateGuildSettings(guildSettings, {
      data: { adminRoleId: role.id },
    });
    AdministratorRoleCommand.reply(
      interaction,
      client.embeds.success(`Administrator role changed to ${role}`),
    );
    LoggingServices.adminLog(
      interaction.guild,
      client.embeds.info({
        title: 'Administrator Role Changed',
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

export default AdministratorRoleCommand;
