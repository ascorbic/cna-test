const { Server } = require("http");
const { Bridge } = require("@vercel/node/dist/bridge");
// This path is specific to next@canary. In a live version we'd resolve various versions of next
const NextServer = require("next/dist/server/next-server").default;
function makeHandler() {
  return (conf) => {
    const nextServer = new NextServer({
      conf,
      dir: ".",
      minimalMode: true,
      customServer: false,
    });
    const requestHandler = nextServer.getRequestHandler();
    const server = new Server(async (req, res) => {
      try {
        await requestHandler(req, res);
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    });
    const bridge = new Bridge(server);
    bridge.listen();

    // This function isn't used like this, but is serialised with `toString()` and written as the launcher function
    return async (event, context) => {
      let result = await bridge.launcher(event, context);
      /** @type import("@netlify/functions").HandlerResponse */
      return {
        ...result,
        isBase64Encoded: result.encoding === "base64",
      };
    };
  };
}

exports.getHandler = async function (odb = false) {
  return `
const { Server } = require("http");
// We copy the file here rather than requiring from the node module 
const { Bridge } = require("./bridge");
// Specific to this Next version
const NextServer = require("next/dist/server/next-server").default;
const { builder } = require("@netlify/functions");
const { config }  = require(process.cwd() + "/.next/required-server-files.json")

exports.handler = ${
    odb
      ? `builder((${makeHandler().toString()})(config));`
      : `(${makeHandler().toString()})(config);`
  }
`;
};
