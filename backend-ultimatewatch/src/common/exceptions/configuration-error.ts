export class ConfigurationError extends Error {
  constructor(configurationName?: string) {
    const message = configurationName
      ? `There was an error in the following configuration: (${configurationName})`
      : 'There was an error in the configuration';

    super(message);
  }
}
