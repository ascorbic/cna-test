// @ts-check
const { getHandler } = require("./getHandler");
const fs = require("fs").promises;
const { ensureDir } = require("fs-extra");
const path = require("path");
const DEFAULT_FUNCTIONS_SRC = "netlify/functions";
const { writeRedirects } = require("./writeRedirects");
module.exports = {
  async onBuild({
    constants: {
      PUBLISH_DIR,
      FUNCTIONS_SRC = DEFAULT_FUNCTIONS_SRC,
      INTERNAL_FUNCTIONS_SRC,
      ...rest
    },
  }) {
    const FUNCTION_DIR = INTERNAL_FUNCTIONS_SRC || FUNCTIONS_SRC;
    const bridgeFile = require.resolve("@vercel/node/dist/bridge");
    console.log(PUBLISH_DIR);
    await Promise.all(
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

    await writeRedirects({
      publishDir: PUBLISH_DIR,
      nextRoot: path.dirname(PUBLISH_DIR),
    });
  },
};
