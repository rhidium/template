import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder } from 'discord.js';
import { ButtonCommand, Embeds, PermLevel } from '@rhidium/core';
import EvalConstants from '../enums/eval';
import Lang from '@/i18n/i18n';

const EvalDeclineCommand = new ButtonCommand({
  customId: EvalConstants.CANCEL_CODE_EVALUATION,
  permLevel: PermLevel['Bot Administrator'],
  run: async (client, interaction) => {
    await EvalDeclineCommand.reply(interaction, Lang.t('commands:eval.cancelling'));

    const evalEmbed = interaction.message.embeds[0];
    if (!evalEmbed) {
      EvalDeclineCommand.reply(interaction, client.embeds.error(
        Lang.t('commands:eval.noCodeInOriginMessage'),
      ));
      return;
    }

    const embed = EmbedBuilder.from(evalEmbed);
    const inputWithCodeblock = Embeds.extractDescription(embed);
    if (!inputWithCodeblock) {
      EvalDeclineCommand.reply(interaction, client.embeds.error(
        Lang.t('commands:eval.noCodeProvided'),
      ));
      return;
    }

    embed.setColor(Colors.Red);
    embed.setTitle(`${client.clientEmojis.error} ${Lang.t('commands:eval.cancelledBy', {
      username: interaction.user.username,
    })}}`);
    embed.setDescription(inputWithCodeblock);

    await interaction.message.edit({
      embeds: [embed],
      components: [ evalDeclinedRow ],
    }).catch(() => null);
    EvalDeclineCommand.reply(interaction, Lang.t('commands:eval.cancelled'));
  },
});

export default EvalDeclineCommand;

export const evalDeclinedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId(EvalConstants.CANCEL_CODE_EVALUATION)
    .setLabel(Lang.t('general:cancelled'))
    .setDisabled(true)
    .setStyle(ButtonStyle.Secondary),
);
