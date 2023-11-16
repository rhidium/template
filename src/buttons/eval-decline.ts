import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder } from 'discord.js';
import { ButtonCommand, Embeds, PermLevel } from '@rhidium/core';
import EvalConstants from '../enums/eval';

const EvalDeclineCommand = new ButtonCommand({
  customId: EvalConstants.CANCEL_CODE_EVALUATION,
  permLevel: PermLevel['Bot Administrator'],
  run: async (client, interaction) => {
    await EvalDeclineCommand.reply(interaction, 'Cancelling code evaluation...');

    const evalEmbed = interaction.message.embeds[0];
    if (!evalEmbed) {
      EvalDeclineCommand.reply(interaction, client.embeds.error(
        'The code to evaluate could not be resolved from origin message, please try again',
      ));
      return;
    }

    const embed = EmbedBuilder.from(evalEmbed);
    const inputWithCodeblock = Embeds.extractDescription(embed);
    if (!inputWithCodeblock) {
      EvalDeclineCommand.reply(interaction, client.embeds.error(
        'No code was provided, please try again',
      ));
      return;
    }

    embed.setColor(Colors.Red);
    embed.setTitle(`${client.clientEmojis.error} This code evaluation was cancelled by ${interaction.user.username}`);
    embed.setDescription(inputWithCodeblock);

    await interaction.message.edit({
      embeds: [embed],
      components: [ evalDeclinedRow ],
    }).catch(() => null);
    EvalDeclineCommand.reply(interaction, 'Code evaluation cancelled');
  },
});

export default EvalDeclineCommand;

export const evalDeclinedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId(EvalConstants.CANCEL_CODE_EVALUATION)
    .setLabel('Cancelled')
    .setDisabled(true)
    .setStyle(ButtonStyle.Secondary),
);
