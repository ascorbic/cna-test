console.log(process.cwd());

process.env.NODE_ENV = "production";

const { Server } = require("http");
const { Bridge } = require("./bridge");
const NextServer = require("next/dist/server/next-server.js").default;
const nextServer = new NextServer({
  conf: {
    env: [],
    webpack: null,
    webpackDevMiddleware: null,
    distDir: ".next",
    cleanDistDir: true,
    assetPrefix: "",
    configOrigin: "next.config.js",
    useFileSystemPublicRoutes: true,
    generateEtags: true,
    pageExtensions: ["tsx", "ts", "jsx", "js"],
    target: "server",
    poweredByHeader: true,
    compress: false,
    analyticsId: "",
    images: {
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      path: "/_next/image",
      loader: "default",
      domains: [],
      disableStaticImages: false,
    },
    devIndicators: { buildActivity: true },
    onDemandEntries: { maxInactiveAge: 60000, pagesBufferLength: 2 },
    amp: { canonicalBase: "" },
    basePath: "",
    sassOptions: {},
    trailingSlash: false,
    i18n: null,
    productionBrowserSourceMaps: false,
    optimizeFonts: true,
    experimental: {
      cpus: 3,
      plugins: false,
      profiling: false,
      sprFlushToDisk: true,
      workerThreads: false,
      pageEnv: false,
      optimizeImages: false,
      optimizeCss: false,
      scrollRestoration: false,
      stats: false,
      externalDir: false,
      reactRoot: false,
      disableOptimizedLoading: false,
      gzipSize: true,
      craCompat: false,
    },
    excludeDefaultMomentLocales: true,
    future: { strictPostcssConfiguration: false },
    serverRuntimeConfig: {},
    publicRuntimeConfig: {},
    reactStrictMode: false,
  },
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
exports.handler = async (event, context) => {
  console.log(event);
  const result = await bridge.launcher(event, context);
  result.isBase64Encoded = result.encoding === "base64";
  console.log(result.headers);
  return result;
};
