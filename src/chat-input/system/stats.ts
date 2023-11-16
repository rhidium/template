import { ChatInputCommand, TimeUtils, UnitConstants } from '@rhidium/core';
import { stripIndents } from 'common-tags';
import { getInfo } from 'discord-hybrid-sharding';
import { SlashCommandBuilder, version } from 'discord.js';

const discordVersion = version.indexOf('dev') < 0 ? version : version.slice(0, version.indexOf('dev') + 3);
const discordVersionDocLink = 'https://discord.js.org/#/docs/discord.js/main/general/welcome';
const nodeVersionDocLink = `https://nodejs.org/docs/latest-${ process.version.split('.')[0] }.x/api/#`;

const StatsCommand = new ChatInputCommand({
  // aliases: ['ping'],
  data: new SlashCommandBuilder()
    .setDescription('Display detailed bot statistics'),
  run: async (client, interaction) => {
    // Latency
    const reply = await interaction.reply({
      content: 'Pinging...',
      fetchReply: true,
    });
    const fullCircleLatency = reply.createdTimestamp - interaction.createdTimestamp;
    const latencyEmoji = (ms: number) => {
      let emoji;
      if (ms < 150) emoji = '🟢';
      else if (ms < 250) emoji = '🟡';
      else emoji = '🔴';
      return emoji;
    };

    // Counts
    const guildCount = client.guilds.cache.size;
    const memberCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const channelCount = client.channels.cache.size;
    const roleCount = client.guilds.cache.reduce((acc, guild) => acc + guild.roles.cache.size, 0);

    // Memory
    const memoryUsage = process.memoryUsage();
    const memoryUsedInMB = memoryUsage.heapUsed / UnitConstants.BYTES_IN_KIB / UnitConstants.BYTES_IN_KIB;
    const memoryAvailableInMB = memoryUsage.heapTotal / UnitConstants.BYTES_IN_KIB / UnitConstants.BYTES_IN_KIB;
    const objCacheSizeInMB = memoryUsage.external / UnitConstants.BYTES_IN_KIB / UnitConstants.BYTES_IN_KIB;

    // Create our embed
    const embed = client.embeds.branding({
      title: 'Statistics',
      fields: [{
        name: 'Latency',
        value: stripIndents`
          ${latencyEmoji(Math.round(client.ws.ping))} **API Latency:** ${Math.round(client.ws.ping)}ms
          ${latencyEmoji(fullCircleLatency)} **Full Circle Latency:** ${Math.round(fullCircleLatency)}ms
        `,
        inline: true,
      }, {
        name: 'Memory',
        value: stripIndents`
          💾 **Memory Usage:** ${ memoryUsedInMB.toFixed(2) }/${ memoryAvailableInMB.toFixed(2) } MB 
          ♻️ **Cache Size:** ${ objCacheSizeInMB.toFixed(2) } MB
        `,
        inline: true,
      }, {
        name: 'Uptime',
        value: `🕐 ${TimeUtils.msToHumanReadableTime(client.uptime ?? 0)}`,
        inline: false,
      }, {
        name: 'Counts',
        value: [
          `👪 **Servers:** ${guildCount.toLocaleString()}`,
          `🙋 **Members:** ${memberCount.toLocaleString()}`,
          `#️⃣ **Channels:** ${channelCount.toLocaleString()}`,
          `🪪 **Roles:** ${roleCount.toLocaleString()}`,
        ].join('\n'),
        inline: true,
      }, {
        name: 'System',
        value: stripIndents`
          ⚙️ **Discord.js Version:** [v${ discordVersion }](${ discordVersionDocLink })
          ⚙️ **Node Version:** [${ process.version }](${ nodeVersionDocLink })
        `,
        inline: true,
      }],
    });

    // Let's not forget about our clustering/sharding information
    if (client.cluster) {
      let shardsOutput;
      try {
        const shardStatuses = await client.cluster.broadcastEval((ctx) => {
          return {
            shards: ctx.cluster? [...ctx.cluster.ids.keys()].length : 0,
            readyAt: ctx.readyAt,
          };
        });
        const shardStatusArr = shardStatuses.map(({ shards, readyAt }) => {
          if (shards === 0) return '🟥'.repeat(shards);
          if (!readyAt) return '🟨'.repeat(shards);
          return '🟩'.repeat(shards);
        });
        if (shardStatusArr.length < getInfo().TOTAL_SHARDS) {
          shardStatusArr.push(...Array(getInfo().TOTAL_SHARDS - shardStatusArr.length).fill('🟥'));
        }
        shardsOutput = stripIndents`
          ${shardStatusArr.join('')}

          🟩 = Shard is online and responsive
          🟨 = Shard spawned, but hasn't logged in
          🟥 = Shard has not been spawned
        `;
      } catch {
        shardsOutput = 'Shards are still being spawned, please try again later';
      }
  
      const totalMemberCount = client.cluster
        ? await client.cluster
          .broadcastEval(c => c.guilds.cache.reduce((a, b) => a + b.memberCount ?? 0, 0))
          .then(results => results.reduce((prev, val) => prev + val, 0))
        : client.guilds.cache.reduce((a, b) => a + b.memberCount ?? 0, 0);
      const totalGuildCount = client.cluster
        ? await client.cluster
          .broadcastEval(c => c.guilds.cache.size)
          .then(results => results.reduce((prev, val) => prev + val, 0))
        : client.guilds.cache.size;
      embed.addFields({
        name: '\u200b',
        value: '\u200b',
        inline: false,
      }, {
        name: 'Cluster',
        value: stripIndents`
          📡 **Shards:** ${getInfo().TOTAL_SHARDS.toLocaleString()}
          📡 **Clusters:** ${client.cluster.count.toLocaleString()}
          🙋 **Total Members:** ${totalMemberCount.toLocaleString()}
          👪 **Total Guilds:** ${totalGuildCount.toLocaleString()}
        `,
        inline: true,
      }, {
        name: 'Shard Status',
        value: shardsOutput,
        inline: true,
      });
    }

    // Reply with our embed
    await StatsCommand.reply(interaction, {
      content: '',
      embeds: [embed],
    });
  },
});

export default StatsCommand;
