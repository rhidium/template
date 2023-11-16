import { SlashCommandBuilder, SlashCommandUserOption } from 'discord.js';
import { ChatInputCommand, PermissionUtils, resolvePermLevel } from '@rhidium/core';

const PermLevelCommand = new ChatInputCommand({
  isEphemeral: true,
  // aliases: ['pl'],
  data: new SlashCommandBuilder()
    .setDescription('Display your internal permission level')
    .addUserOption(
      new SlashCommandUserOption()
        .setName('user')
        .setDescription('The user to check the permission level of')
        .setRequired(false),
    ),
  requiredResourceIds: {
    guilds: [ 'something' ],
  },
  run: async (client, interaction) => {
    const { guild, options } = interaction;
    const targetUser = options.getUser('user', false);
    const member = targetUser
      ? await guild?.members.fetch(targetUser.id).catch(() => null) ?? null
      : interaction.member;
    const memberPermLevel = await PermissionUtils.resolveMemberPermLevel(
      client,
      member,
      guild,
    );
    const memberPermLevelName = resolvePermLevel(memberPermLevel);
    const prefix = targetUser ? `${targetUser}'s` : 'Your';
    PermLevelCommand.reply(interaction, {
      content: `${prefix} internal permission level is: ${memberPermLevel} - ${memberPermLevelName}`,
    });
  },
});

export default PermLevelCommand;
