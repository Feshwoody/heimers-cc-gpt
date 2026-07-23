export const DEFAULT_MACROBOARD_URL = "https://always-be-ready.de";

export type ConnectorConfig = {
  sessionCode: string;
  secret: string;
  url: string;
  displayName: string;
  mock: boolean;
};

type Environment = Record<string, string | undefined>;

const namedValue = (args: string[], flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const positionalValues = (args: string[]) => {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index].startsWith("--")) {
      if (args[index] !== "--mock") index += 1;
      continue;
    }
    values.push(args[index]);
  }
  return values;
};

export function parseConnectorConfig(args: string[], env: Environment = process.env): ConnectorConfig {
  // Some npm/PowerShell combinations expose named npm arguments as npm_config_*
  // and leave only their values in argv. The positional fallback keeps that
  // documented invocation working without weakening normal named parsing.
  const positional = positionalValues(args);
  const sessionCode = (
    namedValue(args, "--session") ??
    env.MACROBOARD_SESSION_CODE ??
    env.npm_config_session ??
    positional[0] ??
    ""
  ).trim().toUpperCase();
  const secret =
    namedValue(args, "--secret") ??
    env.MACROBOARD_CONNECTOR_SECRET ??
    env.npm_config_secret ??
    positional[1] ??
    "";
  const url = (
    namedValue(args, "--url") ??
    env.MACROBOARD_URL ??
    env.npm_config_url ??
    positional[2] ??
    DEFAULT_MACROBOARD_URL
  ).trim();
  const displayName = (
    namedValue(args, "--name") ??
    env.CONNECTOR_DISPLAY_NAME ??
    env.npm_config_name ??
    positional[3] ??
    "MacroBoard Connector"
  ).trim();

  return { sessionCode, secret, url, displayName, mock: args.includes("--mock") };
}
