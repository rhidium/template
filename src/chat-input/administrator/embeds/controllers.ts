import ConfigureEmbedsCommand from '.';
import { configureEmbedOptions } from './options';
import {
  configureEmbedInputToEmbedData,
  embedFromEmbedModel,
  resolveConfigureEmbedData,
  settingsKeyFromEmbedOption,
} from './helpers';
import { EmbedController, EmbedFieldController } from './types';
import {
  ComponentType,
  EmbedBuilder,
  EmbedField,
  escapeCodeBlock,
  resolveColor,
} from 'discord.js';
import {
  configureEmbedAcceptedRow,
  configureEmbedControlRow,
} from './components';
import { Prisma } from '@prisma/client';
import { EmbedConfigurationConstants } from './enums';
import { LoggingServices } from '@/services';
import {
  buildDiscordPlaceholders,
  replacePlaceholders,
  replacePlaceholdersAcrossEmbed,
} from '@/placeholders';
import { EmbedConstants, StringUtils, UnitConstants } from '@rhidium/core';
import { guildTTLCache, prisma } from '@/database';

const jsonCodeBlockOffset = 12;

export const configureEmbedController: EmbedController = async (
  client,
  interaction,
  guildSettings,
) => {
  const options = interaction.options;
  const embedOptionInput = options.getInteger(
    EmbedConfigurationConstants.EMBED_COMMAND_OPTION_NAME,
    true,
  );

  const settingKey = settingsKeyFromEmbedOption(embedOptionInput);
  const setting = guildSettings[settingKey];
  const humanFriendlySettingKey = StringUtils.titleCase(
    StringUtils.splitOnUppercase(settingKey),
  );

  const nullableByNone = (value: string | null) =>
    value === 'none' ? null : value ?? undefined;

  const embedData = Object.fromEntries(
    configureEmbedOptions.map((option) => {
      const value = options.getString(option.name);
      return [option.name, nullableByNone(value)];
    }),
  );

  const {
    embed: configureEmbedData,
    message: configureEmbedMessage,
  } = configureEmbedInputToEmbedData(embedData);
  const embedFromSetting = setting
    ? embedFromEmbedModel(setting)
    : new EmbedBuilder();
  const rawEmbed = resolveConfigureEmbedData(configureEmbedData, embedFromSetting);

  const placeholders = buildDiscordPlaceholders(
    interaction.channel,
    interaction.guild,
    interaction.member,
    interaction.user
  );
  const embed = replacePlaceholdersAcrossEmbed(rawEmbed, placeholders);
  const resolvedMessage = configureEmbedMessage ? replacePlaceholders(
    configureEmbedMessage,
    placeholders,
  ) : null;

  const messageSuffix = resolvedMessage ? `\n\n${resolvedMessage}` : '';
  const msg = await ConfigureEmbedsCommand.reply(interaction, {
    content: `This is what the embed will look like, do you want to continue?${messageSuffix}`,
    embeds: [embed],
    components: [configureEmbedControlRow],
    fetchReply: true,
  });

  if (!msg) {
    ConfigureEmbedsCommand.reply(
      interaction,
      client.embeds.error(
        'Failed to send embed preview, please try again later',
      ),
    );
    return;
  }

  let i;
  try {
    i = await msg.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: UnitConstants.MS_IN_ONE_MINUTE * 5,
      filter: (i) =>
        i.customId === EmbedConfigurationConstants.CONFIGURE_CONTINUE ||
        i.customId === EmbedConfigurationConstants.CONFIGURE_CANCEL,
    });
  } catch {
    ConfigureEmbedsCommand.reply(
      interaction,
      client.embeds.error('Embed configuration expired'),
    );
    return;
  }

  if (i.user.id !== interaction.user.id) {
    i.reply({
      content:
        'You cannot interact with this component as it was created for someone else',
      ephemeral: true,
    });
    return;
  }

  if (i.customId === EmbedConfigurationConstants.CONFIGURE_CANCEL) {
    i.update({
      content: 'Embed configuration cancelled',
      components: [],
    });
    return;
  }

  const upsertId = guildSettings[`${settingKey}Id`] ?? null;
  if (upsertId === null) {
    i.update({
      content:
        'Embed configuration failed, settingKey id reference field ' +
        'couldn\'t be resolved - please try again later',
      components: [],
    });
    return;
  }

  await ConfigureEmbedsCommand.deferReplyInternal(i);

  const fields =
    configureEmbedData.fields
      .filter((field) => {
        const [name, value] = field.split(';');
        return name && value;
      })
      .map((field) => {
        const [name, value, inline] = field.split(';');
        return {
          name: name as string,
          value: value as string,
          inline: inline === 'true',
        };
      }) ?? [];

  const upsertData: {
    messageText?: string | null;
    color?: number | null;
    authorName?: string | null;
    authorIconURL?: string | null;
    authorURL?: string | null;
    title?: string | null;
    description?: string | null;
    url?: string | null;
    imageURL?: string | null;
    thumbnailURL?: string | null;
    footerText?: string | null;
    footerIconURL?: string | null;
    fields?: { create: EmbedField[] };
  } = {};

  if (rawEmbed.data.color) upsertData.color = rawEmbed.data.color;
  upsertData.messageText = configureEmbedMessage ?? null;
  upsertData.authorName = rawEmbed.data.author?.name ?? null;
  upsertData.authorIconURL = rawEmbed.data.author?.icon_url ?? null;
  upsertData.authorURL = rawEmbed.data.author?.url ?? null;
  upsertData.title = rawEmbed.data.title ?? null;
  upsertData.description = rawEmbed.data.description ?? null;
  upsertData.url = rawEmbed.data.url ?? null;
  upsertData.imageURL = rawEmbed.data.image?.url ?? null;
  upsertData.thumbnailURL = rawEmbed.data.thumbnail?.url ?? null;
  upsertData.footerText = rawEmbed.data.footer?.text ?? null;
  upsertData.footerIconURL = rawEmbed.data.footer?.icon_url ?? null;
  if (fields.length > 0) upsertData.fields = { create: fields };

  const newTotalFields = (setting?.fields?.length ?? 0) + fields.length;
  if (newTotalFields > EmbedConstants.MAX_FIELDS_LENGTH) {
    i.editReply({
      content: `Embed configuration failed, embed fields length exceeds maximum of ${EmbedConstants.MAX_FIELDS_LENGTH}`,
    });
    interaction.editReply({
      components: [configureEmbedAcceptedRow],
    });
    return;
  }

  const createEmbedColor = configureEmbedData.color
    ? resolveColor(`#${configureEmbedData.color.replaceAll('#', '')}`)
    : null;
  const createEmbedData: Prisma.EmbedCreateInput = {
    memberJoinEmbed: {
      connect: {
        guildId: interaction.guildId,
      },
    },
    messageText: configureEmbedMessage ?? null,
    color: createEmbedColor ?? null,
    authorName: configureEmbedData.authorName ?? null,
    authorIconURL: configureEmbedData.authorIconUrl ?? null,
    authorURL: configureEmbedData.authorUrl ?? null,
    title: configureEmbedData.title ?? null,
    description: configureEmbedData.description ?? null,
    url: configureEmbedData.url ?? null,
    imageURL: configureEmbedData.imageUrl ?? null,
    thumbnailURL: configureEmbedData.thumbnailUrl ?? null,
    footerText: configureEmbedData.footerText ?? null,
    footerIconURL: configureEmbedData.footerIconUrl ?? null,
    fields: { create: fields },
  };

  guildTTLCache.delete(interaction.guildId);
  const updatedEmbed = await prisma.embed.upsert({
    update: upsertData,
    create: createEmbedData,
    where: {
      id: upsertId!,
    },
    include: { fields: true },
  });

  i.editReply({
    content: 'Embed configuration successful',
  });
  interaction.editReply({
    components: [configureEmbedAcceptedRow],
  });

  const newEmbedData = msg.embeds[0];
  if (!newEmbedData) return;
  const jsonOutput = escapeCodeBlock(
    JSON.stringify(updatedEmbed, null, 2)
  ).slice(0, EmbedConstants.FIELD_VALUE_MAX_LENGTH - jsonCodeBlockOffset);
  LoggingServices.adminLog(
    interaction.guild,
    client.embeds.info({
      title: 'Embed Configuration Changed',
      fields: [
        {
          name: 'Member',
          value: interaction.user.toString(),
          inline: true,
        },
        {
          name: 'Embed',
          value: `\`\`\`${humanFriendlySettingKey}\`\`\``,
          inline: true,
        },
        {
          name: 'Fields',
          value: `\`\`\`${newEmbedData.fields?.length ?? 0}\`\`\``,
          inline: true,
        },
        {
          name: 'JSON',
          value: `\`\`\`json\n${jsonOutput}\n\`\`\``,
        },
      ],
    }),
  );
};

export const manageEmbedFieldsController: EmbedFieldController = async (
  client,
  interaction,
  _guildSettings,
  setting,
) => {
  const { options } = interaction;
  const subcommand = options.getSubcommand(true);
  const embedOptionInput = options.getInteger(
    EmbedConfigurationConstants.EMBED_COMMAND_OPTION_NAME,
    true,
  );
  const settingKey = settingsKeyFromEmbedOption(embedOptionInput);
  const humanFriendlySettingKey = StringUtils.titleCase(
    StringUtils.splitOnUppercase(settingKey),
  );

  switch (subcommand) {
  case EmbedConfigurationConstants.MANAGE_FIELDS_ADD: {
    if (!setting) {
      ConfigureEmbedsCommand.reply(
        interaction,
        client.embeds.error(
          'Embed not configured, nothing to add to - please create the embed first',
        ),
      );
      return;
    }

    const name = options.getString('name', true);
    const value = options.getString('value', true);
    const inline = options.getBoolean('inline') ?? true;

    if (setting.fields.length === EmbedConstants.MAX_FIELDS_LENGTH) {
      ConfigureEmbedsCommand.reply(
        interaction,
        client.embeds.error(
          `Embed fields length exceeds maximum of ${EmbedConstants.MAX_FIELDS_LENGTH}`,
        ),
      );
      return;
    }

    const newField: EmbedField = {
      name,
      value,
      inline,
    };

    guildTTLCache.delete(interaction.guildId);
    const updatedSetting = await prisma.embed.update({
      where: { id: setting.id },
      include: { fields: true },
      data: {
        fields: {
          create: [newField],
        },
      },
    });

    const rawEmbed = embedFromEmbedModel(updatedSetting);
    const placeholders = buildDiscordPlaceholders(
      interaction.channel,
      interaction.guild,
      interaction.member,
      interaction.user
    );
    const embed = replacePlaceholdersAcrossEmbed(rawEmbed, placeholders);
    const resolvedMessage = updatedSetting.messageText
      ? replacePlaceholders(updatedSetting.messageText, placeholders)
      : null;
    const messageSuffix = resolvedMessage ? `\n\n${resolvedMessage}` : '';

    ConfigureEmbedsCommand.reply(interaction, {
      content: `Field added to embed successfully, here is a preview:${messageSuffix}`,
      embeds: [embed],
    });

    const jsonOutput = escapeCodeBlock(
      JSON.stringify(newField, null, 2),
    ).slice(0, EmbedConstants.FIELD_VALUE_MAX_LENGTH - jsonCodeBlockOffset);
    LoggingServices.adminLog(
      interaction.guild,
      client.embeds.info({
        title: 'Embed Field Added',
        fields: [
          {
            name: 'Member',
            value: `\`\`\`${interaction.user.username}\`\`\``,
            inline: true,
          },
          {
            name: 'Embed',
            value: `\`\`\`${humanFriendlySettingKey}\`\`\``,
            inline: true,
          },
          {
            name: 'Field',
            value: `\`\`\`json\n${jsonOutput}\n\`\`\``,
          },
        ],
      }),
    );

    break;
  }

  case EmbedConfigurationConstants.MANAGE_FIELDS_REMOVE: {
    if (!setting) {
      ConfigureEmbedsCommand.reply(
        interaction,
        client.embeds.error(
          'Embed not configured, nothing to remove from - please create the embed first',
        ),
      );
      return;
    }

    const index = options.getInteger('index', true);
    if (index < 1 || index > setting.fields.length) {
      ConfigureEmbedsCommand.reply(
        interaction,
        client.embeds.error(
          `Index must be between 1 and ${setting.fields.length}`,
        ),
      );
      return;
    }

    const targetField = setting.fields[index - 1];
    if (!targetField) {
      ConfigureEmbedsCommand.reply(
        interaction,
        client.embeds.error(
          `Field at index ${index} not found, provide a valid index between 1 and ${setting.fields.length}`,
        ),
      );
      return;
    }

    guildTTLCache.delete(interaction.guildId);
    const updatedSetting = await prisma.embed.update({
      where: { id: setting.id },
      include: { fields: true },
      data: {
        fields: { delete: { id: targetField.id } },
      },
    });

    const rawEmbed = embedFromEmbedModel(updatedSetting);
    const placeholders = buildDiscordPlaceholders(
      interaction.channel,
      interaction.guild,
      interaction.member,
      interaction.user
    );
    const embed = replacePlaceholdersAcrossEmbed(rawEmbed, placeholders);
    const resolvedMessage = updatedSetting.messageText
      ? replacePlaceholders(updatedSetting.messageText, placeholders)
      : null;
    const messageSuffix = resolvedMessage ? `\n\n${resolvedMessage}` : '';


    ConfigureEmbedsCommand.reply(interaction, {
      content: `Field removed from embed successfully, here is a preview:${messageSuffix}`,
      embeds: [embed],
    });

    const jsonOutput = escapeCodeBlock(
      JSON.stringify(targetField, null, 2),
    ).slice(0, EmbedConstants.FIELD_VALUE_MAX_LENGTH - jsonCodeBlockOffset);
    LoggingServices.adminLog(
      interaction.guild,
      client.embeds.info({
        title: 'Embed Field Removed',
        fields: [
          {
            name: 'Member',
            value: `\`\`\`${interaction.user.username}\`\`\``,
            inline: true,
          },
          {
            name: 'Embed',
            value: `\`\`\`${humanFriendlySettingKey}\`\`\``,
            inline: true,
          },
          {
            name: 'Field',
            value: `\`\`\`json\n${jsonOutput}\n\`\`\``,
          },
        ],
      }),
    );

    break;
  }

  case EmbedConfigurationConstants.MANAGE_FIELDS_RESET: {
    if (!setting) {
      ConfigureEmbedsCommand.reply(
        interaction,
        client.embeds.error(
          'Embed not configured, nothing to reset - please create the embed first',
        ),
      );
      return;
    }

    const confirm = options.getBoolean('confirm') ?? false;
    if (!confirm) {
      ConfigureEmbedsCommand.reply(
        interaction,
        client.embeds.error(
          'Please confirm that you want to reset the embed fields in the command options',
        ),
      );
      return;
    }

    guildTTLCache.delete(interaction.guildId);
    const updatedSetting = await prisma.embed.update({
      where: { id: setting.id },
      include: { fields: true },
      data: {
        fields: { deleteMany: {} },
      },
    });

    const rawEmbed = embedFromEmbedModel(updatedSetting);
    const placeholders = buildDiscordPlaceholders(
      interaction.channel,
      interaction.guild,
      interaction.member,
      interaction.user
    );
    const embed = replacePlaceholdersAcrossEmbed(rawEmbed, placeholders);
    const resolvedMessage = updatedSetting.messageText
      ? replacePlaceholders(updatedSetting.messageText, placeholders)
      : null;
    const messageSuffix = resolvedMessage ? `\n\n${resolvedMessage}` : '';

    ConfigureEmbedsCommand.reply(interaction, {
      content: `Fields reset successfully, here is a preview:${messageSuffix}`,
      embeds: [embed],
    });

    LoggingServices.adminLog(
      interaction.guild,
      client.embeds.info({
        title: 'Embed Fields Reset',
        fields: [
          {
            name: 'Member',
            value: `\`\`\`${interaction.user.username}\`\`\``,
            inline: true,
          },
          {
            name: 'Embed',
            value: `\`\`\`${humanFriendlySettingKey}\`\`\``,
            inline: true,
          },
        ],
      }),
    );

    break;
  }

  case EmbedConfigurationConstants.MANAGE_FIELDS_LIST:
  default: {
    if (!setting) {
      ConfigureEmbedsCommand.reply(
        interaction,
        client.embeds.error('Embed not configured, nothing to show'),
      );
      return;
    }

    if (setting.fields.length === 0) {
      ConfigureEmbedsCommand.reply(
        interaction,
        client.embeds.error('Embed has no fields, nothing to show'),
      );
      return;
    }

    const embed = client.embeds.branding({
      fields: setting.fields.map((e, ind) => ({
        name: `#${ind + 1} | ${e.name}`,
        value: e.value,
        inline: e.inline,
      })),
    });

    ConfigureEmbedsCommand.reply(interaction, { embeds: [embed] });
    break;
  }
  }
};
