import { ApplicationCommandType } from 'discord.js';
import { stripIndents } from 'common-tags';
import { Client, ComponentCommandType, TimeUtils, UnitConstants } from '@rhidium/core';
import { CommandStatisticsPayload } from '@/database/CommandStatistics';

export const stringCommandTypeFromInteger = (type: number) => {
  if (type === ApplicationCommandType.ChatInput) return '**Slash** Command';
  if (type === ApplicationCommandType.User) return '**User Context Menu** Command';
  if (type === ApplicationCommandType.Message) return '**Message Context Menu** Command';
  if (type === ComponentCommandType.BUTTON) return '**Button** Component';
  if (type === ComponentCommandType.SELECT_MENU) return '**Select Menu** Component';
  if (type === ComponentCommandType.MODAL) return '**Modal** Component';
  return '**Unknown** Command';
};

export const embedFromUsageStatistics = (client: Client, stats: CommandStatisticsPayload) => {
  const [commandId] = stats.commandId.split('@');

  const runtimeAverage = stats.runtimeMean ? `${stats.runtimeMean.toFixed(2)}ms` : 'Unknown';
  const runtimeMedian = stats.runtimeMedian ? `${stats.runtimeMedian.toFixed(2)}ms` : 'Unknown';
  const runtimeVariance = stats.runtimeVariance ? `${stats.runtimeVariance.toFixed(2)}ms` : 'Unknown';
  const runtimeDeviation = stats.runtimeStdDeviation ? `${stats.runtimeStdDeviation.toFixed(2)}ms` : 'Unknown';

  const runtimeTotal = stats.runtimeTotal ? TimeUtils.msToHumanReadableTime(stats.runtimeTotal) : 'Unknown';
  const firstUsedAt = stats.firstUsedAt ? TimeUtils.discordInfoTimestamp(stats.firstUsedAt.valueOf()) : 'Never';
  const lastUsedAt = stats.lastUsedAt ? TimeUtils.discordInfoTimestamp(stats.lastUsedAt.valueOf()) : 'Never';
  const lastErrorAt =  stats.lastErrorAt ? TimeUtils.discordInfoTimestamp(stats.lastErrorAt.valueOf()) : 'Never';

  const usagesLastHour = stats.usages.filter((u) => u.valueOf() > Date.now() - UnitConstants.MS_IN_ONE_HOUR);
  const usagesLastDay = stats.usages.filter((u) => u.valueOf() > Date.now() - UnitConstants.MS_IN_ONE_DAY);
  const usagesLastWeek = stats.usages.filter((u) => u.valueOf() > Date.now() - UnitConstants.MS_IN_ONE_DAY * 7);
  const usagesLastMonth = stats.usages.filter((u) => u.valueOf() > Date.now() - UnitConstants.MS_IN_ONE_DAY * 30);
  const usagesLastYear = stats.usages.filter((u) => u.valueOf() > Date.now() - UnitConstants.MS_IN_ONE_DAY * 365);

  const averagePerHour = TimeUtils.calculateAverageFromDateArr(stats.usages, UnitConstants.MS_IN_ONE_HOUR);
  const averagePerDay = TimeUtils.calculateAverageFromDateArr(stats.usages, UnitConstants.MS_IN_ONE_DAY);
  const averagePerWeek = TimeUtils.calculateAverageFromDateArr(stats.usages, UnitConstants.MS_IN_ONE_DAY * 7);
  const averagePerMonth = TimeUtils.calculateAverageFromDateArr(stats.usages, UnitConstants.MS_IN_ONE_DAY * 30);
  const averagePerYear = TimeUtils.calculateAverageFromDateArr(stats.usages, UnitConstants.MS_IN_ONE_DAY * 365);

  const embed = client.embeds.branding({
    title: `Command Statistics for ${commandId}`,
    description: stripIndents`
      **${commandId}** has been used **${stats.usages.length}** times:

      **Last Hour**: ${usagesLastHour.length} (~${averagePerHour.toFixed(2)}/h)
      **Last Day**: ${usagesLastDay.length} (~${averagePerDay.toFixed(2)}/d)
      **Last Week**: ${usagesLastWeek.length} (~${averagePerWeek.toFixed(2)}/w)
      **Last Month**: ${usagesLastMonth.length} (~${averagePerMonth.toFixed(2)}/M)
      **Last Year**: ${usagesLastYear.length} (~${averagePerYear.toFixed(2)}/y)
    `,
    fields: [
      {
        name: 'Command Type',
        value: stringCommandTypeFromInteger(stats.type),
        inline: true,
      },
      {
        name: 'Total Usages',
        value: stats.usages.length.toString(),
        inline: true,
      },
      {
        name: 'Total Runtime',
        value: `${runtimeTotal}`,
        inline: true,
      },

      {
        name: 'Average Runtime',
        value: `${runtimeAverage}`,
        inline: true,
      },
      {
        name: 'Median Runtime',
        value: `${runtimeMedian}`,
        inline: true,
      },
      {
        name: 'Runtime Deviation',
        value: `${runtimeDeviation} (variance: ${runtimeVariance})`,
        inline: true,
      },

      {
        name: 'Total Errors',
        value: stats.errorCount.toString(),
        inline: true,
      },
      {
        name: 'Last Error',
        value: lastErrorAt,
        inline: true,
      },
      {
        name: 'Last Error Message',
        value: stats.lastError ? `\`\`\`\n${stats.lastError}\`\`\`` : 'Never',
        inline: !stats.lastError,
      },

      {
        name: 'First Used',
        value: firstUsedAt,
        inline: true,
      },
      {
        name: 'Last Used',
        value: lastUsedAt,
        inline: true,
      },
    ],
  });
  return embed;
};

export const compactEmbedFromUsageStatistics = (
  client: Client,
  stats: CommandStatisticsPayload[],
  indexOffset = 0,
) => {
  const embed = client.embeds.branding({
    title: 'Command Usage Leaderboard',
    description: 'The top most used commands',
    fields: stats.map((stat, index) => {
      const [ commandId ] = stat.commandId.split('@');
      const runtimeAverage = stat.runtimeMean ? `${stat.runtimeMean.toFixed(2)}ms` : 'Unknown';
      const totalRuntime = stat.runtimeTotal ? `${TimeUtils.msToHumanReadableTime(stat.runtimeTotal)}` : 'Unknown';
      return {
        name: `${index + 1 + indexOffset}. ${commandId} (${stringCommandTypeFromInteger(stat.type)})`,
        value: `Used ${stat.usages.length} time${stat.usages.length === 1 ? '' : 's'}`
          + `, ${runtimeAverage} average runtime, ${totalRuntime} total runtime`
        ,
        inline: false,
      };
    }),
  });

  return embed;
};
