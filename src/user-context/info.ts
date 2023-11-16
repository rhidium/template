import { UserContextCommand, ArrayUtils, TimeUtils } from '@rhidium/core';

const UserInfoCommand = new UserContextCommand({
  disabled: process.env.NODE_ENV === 'production',
  run: async (client, interaction) => {
    const { guild, targetUser } = interaction;

    if (!guild) {
      UserInfoCommand.reply(interaction, {
        content: 'This command can only be used on server members, it\'s not available in DM\'s.',
        ephemeral: true,
      });
      return;
    }

    await UserInfoCommand.deferReplyInternal(interaction);

    const target = await guild.members.fetch(targetUser.id);
    if (!target) {
      UserInfoCommand.reply(interaction, {
        content: 'Failed to fetch target member.',
        ephemeral: true,
      });
      return;
    }

    const maxRoles = 25;
    const roles = target.roles.cache
      .filter((role) => role.id !== guild.roles.everyone.id)
      .toJSON()
      .map((e) => e.toString());
    const joinedServer = target.joinedAt ? TimeUtils.discordInfoTimestamp(target.joinedAt.valueOf()) : 'Unknown';
    const joinedDiscord = TimeUtils.discordInfoTimestamp(targetUser.createdAt.valueOf());  
    const roleOutput = ArrayUtils.joinWithLimit(roles, maxRoles, 'None');
    const hasServerAvatar = target.displayAvatarURL() !== null
      && target.displayAvatarURL() !== targetUser.displayAvatarURL();
    const serverAvatarOutput = hasServerAvatar
      ? `[link](<${target.displayAvatarURL({ forceStatic: false, size: 4096 })}>)`
      : 'None';
    const boostingOutput = target.premiumSinceTimestamp !== null
      ? TimeUtils.discordInfoTimestamp(target.premiumSinceTimestamp)
      : 'Member is **not** currently boosting';

    const embed = client.embeds.branding({
      description: roleOutput,
      author: {
        name: target.user.username,
        iconURL: targetUser.displayAvatarURL({ forceStatic: false }),
      },
      fields: [
        {
          name: 'Nickname',
          value: target.nickname ?? 'None',
          inline: true,
        },
        {
          name: 'Server Avatar',
          value: serverAvatarOutput,
        },
        {
          name: 'Boost',
          value: boostingOutput,
          inline: false,
        },
        {
          name: 'Joined Server',
          value: joinedServer,
          inline: false,
        },
        {
          name: 'Joined Discord',
          value: joinedDiscord,
          inline: false,
        },
      ],
    });

    if (hasServerAvatar) embed.setThumbnail(target.displayAvatarURL({ forceStatic: false, size: 1024 }));

    UserInfoCommand.reply(interaction, embed);
  },
});

export default UserInfoCommand;
