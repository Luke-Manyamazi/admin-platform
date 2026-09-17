const path = require('path');

/**
 * Nest's default webpack setup externalises node_modules. In this pnpm
 * workspace, @admin-platform/database resolves to TypeScript source through
 * the workspace link, so it must be bundled rather than left for Node to load
 * at runtime. Otherwise Node attempts to resolve Prisma's generated client as
 * an ESM directory import.
 */
module.exports = (options) => ({
  ...options,
  externals: [
    ({ request }, callback) => {
      if (!request) {
        return callback();
      }

      // Bundle all local workspace packages so their TypeScript source and
      // generated Prisma client are handled by webpack/ts-loader.
      if (request.startsWith('@admin-platform/')) {
        return callback();
      }

      // Keep relative/absolute imports inside the bundle.
      if (request.startsWith('.') || path.isAbsolute(request)) {
        return callback();
      }

      // Externalise third-party dependencies; Node will load these normally.
      return callback(null, `commonjs ${request}`);
    },
  ],
});
