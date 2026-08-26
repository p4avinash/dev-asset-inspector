const VALID_FLAGS = new Set(["--json", "--help", "-h"]);

export type CliOptions = {
  projectRoot: string;
  json: boolean;
  help: boolean;
};

export type ParseArgumentsResult =
  | {
      success: true;
      options: CliOptions;
    }
  | {
      success: false;
      error: string;
    };

export function parseArguments(args: string[]): ParseArgumentsResult {
  let projectRoot = "";
  let json = false;
  let help = false;

  for (const arg of args) {
    if (arg === "--json") {
      json = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }

    if (arg.startsWith("--") && !VALID_FLAGS.has(arg)) {
      return {
        success: false,
        error: `Unknown option: ${arg}`,
      };
    }

    if (!projectRoot) {
      projectRoot = arg;
    }
  }

  return {
    success: true,
    options: {
      projectRoot,
      json,
      help,
    },
  };
}

export function printHelp(): void {
  console.log(`
Asset Inspector

Usage:
  asset-inspector <project-path>
  asset-inspector <project-path> --json

Options:
  --json    Output inspection report as JSON
  --help    Show this help message
  -h        Show this help message
`);
}
