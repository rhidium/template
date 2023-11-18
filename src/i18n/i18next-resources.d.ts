interface Resources {
  general: {
    reason: string;
    guildOnly: string;
    moderator: string;
    noReasonProvided: string;
    unknown: string;
    none: string;
    never: string;
    notSet: string;
    input: string;
    output: string;
    outputTooLarge: string;
    runtime: string;
    continue: string;
    cancel: string;
    saved: string;
    cancelled: string;
    cmdCooldown: string;
    componentNames: {
      command: string;
      component: string;
      category: string;
      slash: string;
      userContext: string;
      messageContext: string;
      button: string;
      selectMenu: string;
      modal: string;
    };
    role: string;
    channel: string;
    member: string;
    embed: string;
    field: string;
    fields: string;
    counts: {
      label: string;
      servers: string;
      members: string;
      channels: string;
      roles: string;
    };
    settings: {
      notFound: string;
    };
    requestedBy: string;
    statistics: string;
    system: {
      label: string;
      latency: string;
      apiLatency: string;
      fullCircleLatency: string;
      memory: string;
      memoryUsage: string;
      cacheSize: string;
      uptime: string;
      version: string;
    };
    shards: {
      onlineAndResponsive: string;
      spawnedButNotReady: string;
      unavailable: string;
      busySpawning: string;
    };
    cluster: {
      label: string;
      shards: string;
      clusters: string;
      totalMembers: string;
      totalGuilds: string;
      shardStatus: string;
    };
    discord: {
      nickname: string;
      serverAvatar: string;
      boost: string;
      joinedServer: string;
      joinedDiscord: string;
      accountCreated: string;
      joinedAt: string;
      memberCount: string;
    };
    errors: {
      noChannel: string;
      notTextChannel: string;
      missingPerms: string;
      errAfterPermCheck: string;
    };
  };

  client: {
    ready: string;
    initialize: {
      start: string;
      success: string;
    };
    clustering: {
      config: {
        disabled: string;
        invalid: string;
      };
      cluster: {
        launch: string;
      };
    };
  };

  commands: {
    commandsHelp: {
      name: string;
      description: string;
      noCmdForQuery: string;
    };
    help: {
      name: string;
      description: string;
    };
    invite: {
      name: string;
      description: string;
      prompt: string;
    };
    permLevel: {
      name: string;
      description: string;
      yourPermLevel: string;
      theirPermLevel: string;
    };
    stats: {
      name: string;
      description: string;
      pinging: string;
    };
    support: {
      name: string;
      description: string;
      noSupportServer: string;
      prompt: string;
    };
    printEmbed: {
      noEmbeds: string;
    };
    userInfo: {
      noMember: string;
      memberNotBoosting: string;
    };
    eval: {
      name: string;
      description: string;
      evaluated: string;
      noCodeInOriginMessage: string;
      errorEncountered: string;
      codeErrored: string;
      evaluationSuccessful: string;
      codeWasEvaluated: string;
      cancelled: string;
      cancelling: string;
      cancelledBy: string;
    };
    embeds: {
      name: string;
      description: string;
      previewPrompt: string;
      previewFailed: string;
      configurationSaved: string;
      configurationExpired: string;
      configurationCancelled: string;
      configurationChanged: string;
      missingUpsertId: string;
      maxFieldSize: string;
      editEmbedMissing: string;
      removeEmbedMissing: string;
      fieldsEditPreview: string;
      fieldsAdded: string;
      indexOutsideRange: string;
      indexFieldNotFound: string;
      fieldRemoved: string;
      fieldRemovedPreview: string;
      fieldsResetEmbedMissing: string;
      fieldsReset: string;
      fieldsResetSuccess: string;
      fieldsListEmbedMissing: string;
      fieldsListEmpty: string;
      embedToConfigure: string;
      embedOptions: {
        memberJoin: string;
        memberLeave: string;
      };
    };
    placeholders: {
      name: string;
      description: string;
      placeholderInfoTitle: string;
      listPlaceholderGroups: string;
      listPlaceholders: string;
      placeholderInfo: string;
      placeholders: string;
      placeholderGroups: string;
      placeholderGroupNotFound: string;
      placeholderNotFound: string;
      availablePlaceholders: string;
      placeholderDefinition: string;
    };
    modLogChannel: {
      name: string;
      description: string;
      title: string;
      disabled: string;
      disabledBy: string;
      disabledTitle: string;
      changed: string;
      changedTitle: string;
    };
    modRole: {
      name: string;
      description: string;
      title: string;
      removed: string;
      removedBy: string;
      removedTitle: string;
      changed: string;
      changedTitle: string;
    };
    adminLogChannel: {
      name: string;
      description: string;
      title: string;
      disabled: string;
      disabledBy: string;
      changed: string;
      changedTitle: string;
    };
    adminRole: {
      name: string;
      description: string;
      title: string;
      removed: string;
      removedBy: string;
      removedTitle: string;
      changed: string;
      changedTitle: string;
    };
    memberJoinChannel: {
      name: string;
      description: string;
      title: string;
      disabled: string;
      disabledBy: string;
      disabledTitle: string;
      changed: string;
      changedTitle: string;
    };
    memberLeaveChannel: {
      name: string;
      description: string;
      title: string;
      disabled: string;
      disabledBy: string;
      disabledTitle: string;
      changed: string;
      changedTitle: string;
    };
    memberJoin: {
      label: string;
      errorLabel: string;
      welcome: string;
    };
    memberLeave: {
      label: string;
      errorLabel: string;
      goodbye: string;
    };
  };
}

export default Resources;
