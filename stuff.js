const { makeVercelLauncher } = require("@vercel/node/dist/launcher");

const run = () => {
  const entrypointPath = require.resolve("next/dist/server/next-server");
  const helpersPath = require.resolve("@vercel/node/dist/helpers");
  console.log(
    makeVercelLauncher({ entrypointPath, helpersPath, shouldAddHelpers: true })
  );
};

run();
