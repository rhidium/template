import { SlashCommandBuilder } from 'discord.js';
import { PlaceholderConstants } from './enums';
import { discordPlaceholders, groupedDiscordPlaceholders } from '@/placeholders';
import { listPlaceholderSubcommandGroup, placeholderInfoSubcommand } from './options';
import PlaceholderGroupOption from '@/auto-completes/placeholder-group';
import PlaceholderOption from '@/auto-completes/placeholder';
import { stripIndents } from 'common-tags';
import ConfigureEmbedsCommand from '../embeds';
import { ChatInputCommand, InteractionUtils, PermLevel } from '@rhidium/core';

const PlaceholdersCommand = new ChatInputCommand({
  permLevel: PermLevel.Administrator,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setDescription('Manage placeholders used throughout the bot')
    .addSubcommand(placeholderInfoSubcommand)
    .addSubcommandGroup(listPlaceholderSubcommandGroup),
  run: async (client, interaction) => {
    const { options } = interaction;
    const subcommand = options.getSubcommand(true);
    const subcommandGroup = options.getSubcommandGroup(false);

    const guildAvailable = InteractionUtils.requireAvailableGuild(client, interaction);
    if (!guildAvailable) return;

    const manageEmbedCommand = await client.commandManager.commandLink(ConfigureEmbedsCommand.data.name);
    if (subcommand === PlaceholderConstants.PLACEHOLDER_INFO_SUBCOMMAND_NAME) {
      const embed = client.embeds.branding({
        title: 'Placeholder Information',
        description: stripIndents`
          Placeholders can be used in messages to dynamically replace the placeholder with a value.

          For example, \`{{user}}\` will be replaced with the user's name, like **${interaction.member.user.username}**.

          These placeholders can be applied to any message that supports them,
          like the welcome and leave messages.

          You can start customizing placeholders by using the **${manageEmbedCommand}** command,
          which will display previews of what your final embeds will look like.
        `,
        fields: [{
          name: 'Placeholder Groups',
          value: `\`\`\`${Object.keys(groupedDiscordPlaceholders).length}\`\`\``,
          inline: true,
        }, {
          name: 'Placeholders',
          value: `\`\`\`${Object.keys(discordPlaceholders).length}\`\`\``,
          inline: true,
        }],
      });
      PlaceholdersCommand.reply(interaction, embed);
      return; // escape early
    }

    switch (subcommandGroup) {
    case PlaceholderConstants.LIST_SUBCOMMAND_GROUP_NAME:
    default: {
      switch (subcommand) {
      case PlaceholderConstants.LIST_PLACEHOLDER_GROUPS_SUBCOMMAND_NAME: {
        const placeholderGroup = options.getString(PlaceholderGroupOption.name, true);
        const resolvedGroup = groupedDiscordPlaceholders[placeholderGroup];
        if (!resolvedGroup) {
          const embed = client.embeds.error(`Placeholder group \`${placeholderGroup}\` not found`);
          PlaceholdersCommand.reply(interaction, embed);
          return;
        }

        const longestKey = Object.keys(resolvedGroup).reduce((a, b) => a.length > b.length ? a : b);
        const centerPadKey = (key: string) => key.padStart((longestKey.length + key.length) / 2, ' ')
          .padEnd(longestKey.length, ' ');

        const embed = client.embeds.branding({
          title: `Available Placeholders for ${placeholderGroup}`,
          description: Object.entries(resolvedGroup)
            .map(([k, v]) => `**\`{{${centerPadKey(k)}}}\`** ${v}`)
            .join('\n'),
        });
        PlaceholdersCommand.reply(interaction, embed);
        break;
      }
      case PlaceholderConstants.LIST_PLACEHOLDERS_SUBCOMMAND_NAME:
      default: {
        const placeholder = options.getString(PlaceholderOption.name, true);
        const cleanPlaceholder = placeholder.replace(/{{|}}/g, '');
        const placeholderValue = discordPlaceholders[cleanPlaceholder as keyof typeof discordPlaceholders];
        if (!placeholderValue) {
          const embed = client.embeds.error(`Placeholder \`${placeholder}\` not found`);
          PlaceholdersCommand.reply(interaction, embed);
          return;
        }

        const embed = client.embeds.branding({
          title: `Placeholder Definition for ${cleanPlaceholder}`,
          description: `**\`${placeholder}\`**\n\`\`\`${placeholderValue}\`\`\``,
        });
        PlaceholdersCommand.reply(interaction, embed);
        break;
      }}
    }}
  },
});

export default PlaceholdersCommand;
