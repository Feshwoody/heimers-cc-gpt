import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_MACROBOARD_URL, parseConnectorConfig } from "./cli.js";

test("parses named CLI parameters", () => {
  const config = parseConnectorConfig(
    ["--session", "abc123", "--secret", "placeholder-secret", "--url", "https://example.test"],
    {},
  );
  assert.deepEqual(config, {
    sessionCode: "ABC123",
    secret: "placeholder-secret",
    url: "https://example.test",
    displayName: "MacroBoard Connector",
    mock: false,
  });
});

test("supports connector environment variables and the production default URL", () => {
  const config = parseConnectorConfig([], {
    MACROBOARD_SESSION_CODE: "n7k4px",
    MACROBOARD_CONNECTOR_SECRET: "placeholder-secret",
  });
  assert.equal(config.sessionCode, "N7K4PX");
  assert.equal(config.secret, "placeholder-secret");
  assert.equal(config.url, DEFAULT_MACROBOARD_URL);
});

test("supports npm PowerShell config variables and stripped positional arguments", () => {
  const config = parseConnectorConfig(["ABC123", "placeholder-secret", "https://always-be-ready.de"], {
    npm_config_session: "ABC123",
    npm_config_secret: "placeholder-secret",
    npm_config_url: "https://always-be-ready.de",
  });
  assert.equal(config.sessionCode, "ABC123");
  assert.equal(config.secret, "placeholder-secret");
  assert.equal(config.url, "https://always-be-ready.de");
});

test("named CLI parameters take precedence over environment values", () => {
  const config = parseConnectorConfig(["--session", "ABC123", "--secret", "cli-placeholder"], {
    MACROBOARD_SESSION_CODE: "N7K4PX",
    MACROBOARD_CONNECTOR_SECRET: "env-placeholder",
  });
  assert.equal(config.sessionCode, "ABC123");
  assert.equal(config.secret, "cli-placeholder");
});
