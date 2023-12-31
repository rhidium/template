import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ModalCommand, PermLevel } from '@rhidium/core';
import EvalConstants from '../enums/eval';

const CodeModalCommand = new ModalCommand({
  customId: EvalConstants.CODE_MODAL_ID,
  permLevel: PermLevel['Bot Administrator'],
  run: async (client, interaction) => {
    const input = interaction.fields.getTextInputValue(EvalConstants.CODE_MODAL_INPUT_ID);
    if (!input || input.length === 0) {
      CodeModalCommand.reply(interaction, client.embeds.error(
        'No code was provided, please try again',
      ));
      return;
    }
    
    const embed = client.embeds.waiting({
      title: 'Are you sure you want to evaluate this code?',
      description: `\`\`\`js\n${input}\n\`\`\``,
    });

    CodeModalCommand.reply(interaction, {
      embeds: [ embed ],
      components: [ evalControlRow ],
    });
  },
});

export const evalControlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId(EvalConstants.ACCEPT_CODE_EVALUATION)
    .setLabel('Accept')
    .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
    .setCustomId(EvalConstants.CANCEL_CODE_EVALUATION)
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary)
);

export default CodeModalCommand;
