import { APICommandType, AutoCompleteOption, PermissionUtils } from '@rhidium/core';

export enum CommandAutoCompleteQueryType {
  CATEGORY = 'category',
  SLASH = 'slash',
  USER_CONTEXT = 'user_context',
  MESSAGE_CONTEXT = 'message_context',
}

const CommandOption = new AutoCompleteOption<APICommandType>({
  name: 'command',
  description: 'Select the command',
  required: true,
  run: async (query, client, interaction) => {
    const { member, guild } = interaction;
    const memberPermLevel = await PermissionUtils.resolveMemberPermLevel(client, member, guild);
    const commands = client.commandManager.chatInput
      .filter((c) =>
        c.data.name.indexOf(query) >= 0
        && client.commandManager.isAppropriateCommandFilter(c, member, memberPermLevel)
      );
    const userCtxCommands = client.commandManager.userContextMenus
      .filter((c) =>
        c.data.name.indexOf(query) >= 0
        && client.commandManager.isAppropriateCommandFilter(c, member, memberPermLevel)
      );
    const messageCtxCommands = client.commandManager.messageContextMenus
      .filter((c) =>
        c.data.name.indexOf(query) >= 0
        && client.commandManager.isAppropriateCommandFilter(c, member, memberPermLevel)
      );

    const categories = [ ...new Set(
      commands.map((c) => c.category)),
    ].filter((e) =>
      e !== null
      && e.indexOf(query) >= 0
    );

    return [
      ...categories.map((c) => ({
        name: `Category: ${c}`,
        value: `${CommandAutoCompleteQueryType.CATEGORY}@${c}`,
      })),
      ...commands.map((c) => ({
        name: `Slash Command: ${c.data.name}`,
        value: `${CommandAutoCompleteQueryType.SLASH}@${c.data.name}`,
      })),
      ...userCtxCommands.map((c) => ({
        name: `User Context Menu: ${c.data.name}`,
        value: `${CommandAutoCompleteQueryType.USER_CONTEXT}@${c.data.name}`,
      })),
      ...messageCtxCommands.map((c) => ({
        name: `Message Context Menu: ${c.data.name}`,
        value: `${CommandAutoCompleteQueryType.MESSAGE_CONTEXT}@${c.data.name}`,
      })),
    ];
  },
});

export default CommandOption;
