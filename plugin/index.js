// @ts-check
const { getHandler } = require("./getHandler");
const fs = require("fs").promises;
const { ensureDir } = require("fs-extra");
const path = require("path");
const DEFAULT_FUNCTIONS_SRC = "netlify/functions";

module.exports = {
  async onBuild({ constants: { FUNCTIONS_SRC = DEFAULT_FUNCTIONS_SRC } }) {
    const handlerSource = await getHandler();
    await ensureDir(path.join(FUNCTIONS_SRC, "handler"));
    await fs.writeFile(
      path.join(FUNCTIONS_SRC, "handler", "handler.js"),
      handlerSource
    );
    const bridgeFile = require.resolve("@vercel/node/dist/bridge");
    await fs.copyFile(
      bridgeFile,
      path.join(FUNCTIONS_SRC, "handler", "bridge.js")
    );
  },
};
