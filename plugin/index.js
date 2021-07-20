// @ts-check
const { getHandler } = require("./getHandler");
const fs = require("fs").promises;
const { ensureDir } = require("fs-extra");
const path = require("path");
const DEFAULT_FUNCTIONS_SRC = "netlify/functions";

module.exports = {
  async onBuild({
    constants: {
      FUNCTIONS_SRC = DEFAULT_FUNCTIONS_SRC,
      INTERNAL_FUNCTIONS_SRC,
    },
  }) {
    const FUNCTION_DIR = INTERNAL_FUNCTIONS_SRC || FUNCTIONS_SRC;
    const bridgeFile = require.resolve("@vercel/node/dist/bridge");

    Promise.all(
      ["___netlify-handler", "___netlify-odb-handler"].map(async (func) => {
        const handlerSource = await getHandler(func.includes("odb"));

        await ensureDir(path.join(FUNCTION_DIR, func));
        await fs.writeFile(
          path.join(FUNCTION_DIR, func, `${func}.js`),
          handlerSource
        );
        await fs.copyFile(
          bridgeFile,
          path.join(FUNCTION_DIR, func, "bridge.js")
        );
      })
    );
  },
};
