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
import Lang from '@/i18n/i18n';

const EvalAcceptCommand = new ButtonCommand({
  customId: EvalConstants.ACCEPT_CODE_EVALUATION,
  permLevel: PermLevel['Bot Administrator'],
  run: async (client, interaction) => {
    const evalEmbed = interaction.message.embeds[0];
    if (!evalEmbed) {
      EvalAcceptCommand.reply(interaction, client.embeds.error(
        Lang.t('commands:eval.noCodeInOriginMessage')
      ));
      return;
    }

    const noCodeEmbed = client.embeds.error(
      Lang.t('commands:eval.noCodeProvided')
    );

    const input = evalEmbed.description;
    if (!input || input.length === 0) {
      EvalAcceptCommand.reply(interaction, noCodeEmbed);
      return;
    }

    const evalEmbedClone = EmbedBuilder.from(evalEmbed);
    const codeInput = Embeds.extractCodeblockDescription(evalEmbedClone);
    if (!codeInput) {
      EvalAcceptCommand.reply(interaction, noCodeEmbed);
      return;
    }

    const inputWithCodeblock = Embeds.extractDescription(evalEmbedClone);
    if (!inputWithCodeblock) {
      EvalAcceptCommand.reply(interaction, noCodeEmbed);
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
        `${Lang.t('commands:eval.errorEncountered')}: \`\`\`${err}\`\`\``,
      ));
      const errorEmbed = EmbedBuilder.from(evalEmbed);
      errorEmbed.setColor(client.colors.error);
      errorEmbed.setTitle(`${client.clientEmojis.error} ${Lang.t('commands:eval.codeErrored')}`);
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
      title: Lang.t('commands:eval.evaluationSuccessful'),
      description: `**${Lang.t('general:input')}:**\n\`\`\`js\n${codeInput}\n\`\`\``,
    });

    if (output.length > EmbedConstants.FIELD_VALUE_MAX_LENGTH) {
      embed.addFields({
        name: `:outbox_tray: ${Lang.t('general:output')}`,
        value: `\`\`\`${Lang.t('general:outputTooLarge')}\`\`\``,
        inline: false,
      });
      files.push(new AttachmentBuilder(output).setName(`${Lang.t('general:output')}.txt`));
    }
    else {
      embed.addFields({
        name: `:outbox_tray: ${Lang.t('general:output')}`,
        value: `\`\`\`${output}\`\`\``,
        inline: false,
      });
    }
    
    embed.addFields({
      name: `:stopwatch: ${Lang.t('general:runtime')}`,
      value: `\`\`\`${runtime}\`\`\``,
      inline: false,
    });

    EvalAcceptCommand.reply(interaction, {
      embeds: [ embed ],
      files,
      components: [ evalAcceptedRow ],
    });

    const newEmbed = client.embeds.success({
      title: Lang.t('commands:eval.codeWasEvaluated'),
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
    .setLabel(Lang.t('commands:eval.evaluated'))
    .setDisabled(true)
    .setStyle(ButtonStyle.Success),
);
