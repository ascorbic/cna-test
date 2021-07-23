// @ts-check
const { getHandler } = require("./getHandler");
const fs = require("fs").promises;
const { ensureDir, existsSync, remove } = require("fs-extra");
const path = require("path");
const DEFAULT_FUNCTIONS_SRC = "netlify/functions";
const { writeRedirects } = require("./writeRedirects");

const HANDLER_FUNCTION_NAME = "___netlify-handler";
const ODB_FUNCTION_NAME = "___netlify-odb-handler";

module.exports = {
  async onPreBuild({ netlifyConfig }) {
    [HANDLER_FUNCTION_NAME, ODB_FUNCTION_NAME].forEach((functionName) => {
      if (!netlifyConfig.functions[functionName]) {
        netlifyConfig.functions[functionName] = {};
      }
      if (!netlifyConfig.functions[functionName].included_files) {
        netlifyConfig.functions[functionName].included_files = [];
      }
      netlifyConfig.functions[functionName].included_files.push(
        ".next/server/**",
        ".next/*.json",
        ".next/BUILD_ID"
      );
    });

    console.log(netlifyConfig);
  },

  async onBuild({
    constants: {
      PUBLISH_DIR,
      FUNCTIONS_SRC = DEFAULT_FUNCTIONS_SRC,
      INTERNAL_FUNCTIONS_SRC,
    },
  }) {
    const FUNCTION_DIR = INTERNAL_FUNCTIONS_SRC || FUNCTIONS_SRC;
    const bridgeFile = require.resolve("@vercel/node/dist/bridge");

    if (INTERNAL_FUNCTIONS_SRC && existsSync(FUNCTIONS_SRC)) {
      await Promise.all(
        [HANDLER_FUNCTION_NAME, ODB_FUNCTION_NAME].map(async (name) => {
          const dir = path.join(FUNCTIONS_SRC, name);
          if (existsSync(dir)) {
            await remove(dir);
          }
        })
      );
    }

    const writeHandler = async (func, odb) => {
      const handlerSource = await getHandler(odb);
      await ensureDir(path.join(FUNCTION_DIR, func));
      await fs.writeFile(
        path.join(FUNCTION_DIR, func, `${func}.js`),
        handlerSource
      );
      await fs.copyFile(bridgeFile, path.join(FUNCTION_DIR, func, "bridge.js"));
    };

    await writeHandler(HANDLER_FUNCTION_NAME, false);
    await writeHandler(ODB_FUNCTION_NAME, true);

    await writeRedirects({
      publishDir: PUBLISH_DIR,
      nextRoot: path.dirname(PUBLISH_DIR),
    });
  },
};
