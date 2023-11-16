import { inspect } from 'util';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { ButtonCommand, EmbedConstants, Embeds, PermLevel, TimeUtils } from '@rhidium/core';
import EvalConstants from '../enums/eval';

const EvalAcceptCommand = new ButtonCommand({
  customId: EvalConstants.ACCEPT_CODE_EVALUATION,
  permLevel: PermLevel['Bot Administrator'],
  run: async (client, interaction) => {
    const evalEmbed = interaction.message.embeds[0];
    if (!evalEmbed) {
      EvalAcceptCommand.reply(interaction, client.embeds.error(
        'The code to evaluate could not be resolved from origin message, please try again',
      ));
      return;
    }

    const input = evalEmbed.description;
    if (!input || input.length === 0) {
      EvalAcceptCommand.reply(interaction, client.embeds.error(
        'No code was provided, please try again',
      ));
      return;
    }
    const evalEmbedClone = EmbedBuilder.from(evalEmbed);
    const codeInput = Embeds.extractCodeblockDescription(evalEmbedClone);
    if (!codeInput) {
      EvalAcceptCommand.reply(interaction, client.embeds.error(
        'No code was provided, please try again',
      ));
      return;
    }

    const inputWithCodeblock = Embeds.extractDescription(evalEmbedClone);
    if (!inputWithCodeblock) {
      EvalAcceptCommand.reply(interaction, client.embeds.error(
        'No code was provided, please try again',
      ));
      return;
    }

    await EvalAcceptCommand.deferReplyInternal(interaction);

    let evaluated: unknown;
    const startEval = process.hrtime.bigint();
    try {
      evaluated = eval(codeInput);
      if (evaluated instanceof Promise) evaluated = await evaluated;
    }
    catch (err) {
      EvalAcceptCommand.reply(interaction, client.embeds.error(
        // Note: We show the full error here at is is a development command
        `Error encountered while evaluating code: \`\`\`${err}\`\`\``,
      ));
      const errorEmbed = EmbedBuilder.from(evalEmbed);
      errorEmbed.setColor(client.colors.error);
      errorEmbed.setTitle(`${client.clientEmojis.error} This code evaluation errored`);
      errorEmbed.setDescription(inputWithCodeblock);
      await interaction.message.edit({
        embeds: [errorEmbed],
        components: [ evalAcceptedRow ],
      }).catch(() => null);
      return;
    }
    
    const files: AttachmentBuilder[] = [];
    const runtime = TimeUtils.runTime(startEval);
    const output = inspect(evaluated, {
      depth: 0,
      showHidden: false,
    });
    const embed = client.embeds.success({
      title: 'Code evaluation successful',
      description: `**Input:**\n\`\`\`js\n${codeInput}\n\`\`\``,
    });

    if (output.length > EmbedConstants.FIELD_VALUE_MAX_LENGTH) {
      embed.addFields({
        name: ':outbox_tray: Output',
        value: '```Output was too large to display, see file attachment```',
        inline: false,
      });
      files.push(new AttachmentBuilder(output).setName('output.txt'));
    }
    else {
      embed.addFields({
        name: ':outbox_tray: Output',
        value: `\`\`\`${output}\`\`\``,
        inline: false,
      });
    }
    
    embed.addFields({
      name: ':stopwatch: Runtime',
      value: `\`\`\`${runtime}\`\`\``,
      inline: false,
    });

    EvalAcceptCommand.reply(interaction, {
      embeds: [ embed ],
      files,
      components: [ evalAcceptedRow ],
    });

    const newEmbed = client.embeds.success({
      title: 'This code has been evaluated',
      description: inputWithCodeblock,
    });
    await interaction.message.edit({
      embeds: [newEmbed],
      components: [ evalAcceptedRow ],
    }).catch(() => null);
  },
});

export default EvalAcceptCommand;

export const evalAcceptedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId(EvalConstants.ACCEPT_CODE_EVALUATION)
    .setLabel('Evaluated')
    .setDisabled(true)
    .setStyle(ButtonStyle.Success),
);
