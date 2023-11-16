interface Resources {
  client: {
    ready: 'Client logged in as {{username}}';
    initialize: {
      start: 'Initializing client...';
      success: 'Finished initializing client in {{duration}}, registered/loaded {{commandSize}} commands';
    };
    clustering: {
      config: {
        disabled: 'CLUSTERING is disabled/null, cannot launch cluster - use ~/client/index instead';
        invalid: 'Invalid cluster configuration, cannot launch cluster';
      };
      cluster: {
        launch: 'Launching cluster {{id}}';
      };
    };
  };
  commands: {
    help: {
      name: 'help';
    };
  };
}

export default Resources;
