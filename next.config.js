module.exports = {
  // Supported targets are "serverless" and "experimental-serverless-trace"
  target: "server",
  async redirects() {
    return [
      {
        source: "/post/:slug(\\d{1,})",
        destination: "/shows/:slug", // Matched parameters can be used in the destination
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/old-blog/:post(\\d{1,})",
        destination: "/shows/:post", // Matched parameters can be used in the destination
      },
    ];
  },
};
