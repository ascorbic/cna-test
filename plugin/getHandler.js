const { Server } = require("http");
const { Bridge } = require("@vercel/node/dist/bridge");
// This path is specific to next@canary. In a live version we'd resolve various versions of next
const NextServer = require("next/dist/server/next-server").default;
const { builder } = require("@netlify/functions");

function getNextConfig(cwd = process.cwd()) {
  const { PHASE_PRODUCTION_BUILD } = require("next/constants");
  const loadConfig = require("next/dist/server/config").default;
  return loadConfig(PHASE_PRODUCTION_BUILD, cwd);
}

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
      let response = {
        ...result,
        isBase64Encoded: result.encoding === "base64",
      };
      // This song and dance is because we don't know if a page needs ODB until it's been processed
      // We do this by ckecking the cache headers. This is not ideal, but it works for now.
      if (
        (result.headers["cache-control"] || "").includes(
          "stale-while-revalidate"
        )
      ) {
        response = builder((event, context, callback) =>
          callback(undefined, response)
        )(event, context, (err, resp) => resp);
      }
      return response;
    };
  };
}

exports.getHandler = async function () {
  const conf = await getNextConfig();
  return `
const { Server } = require("http");
// We copy the file here rather than requiring from the node module 
const { Bridge } = require("./bridge");
// Specific to this Next version
const NextServer = require("next/dist/server/next-server").default;
const { builder } = require("@netlify/functions");
//  Injected from the site conf
const conf=${JSON.stringify(conf)};
//  These contain functions, if the site conf uses them
conf.headers=${
    typeof conf.headers === "function"
      ? `() => ${JSON.stringify(await conf.headers())}`
      : `conf.headers`
  }  
conf.redirects=${
    typeof conf.redirects === "function"
      ? `() => ${JSON.stringify(await conf.redirects())}`
      : `conf.redirects`
  }  
conf.rewrites=${
    typeof conf.rewrites === "function"
      ? `() => ${JSON.stringify(await conf.rewrites())}`
      : `conf.rewrites`
  }  
conf.generateBuildId=${
    typeof conf.generateBuildId === "function"
      ? `() => ${JSON.stringify(await conf.generateBuildId())}`
      : `conf.generateBuildId`
  }  

exports.handler = (${makeHandler().toString()})(conf)
`;
};
