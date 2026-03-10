/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled to fix timer double-execution issue

  // Headers required for SharedArrayBuffer (Linera WASM client)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ]
  },

  // Webpack configuration for WASM and @linera/client
  webpack: (config, { isServer }) => {
    // Exclude @linera/client from server-side bundling
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push('@linera/client')
    }

    // Enable WebAssembly experiments
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    // Handle WASM files properly
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    })

    return config
  },

  // Transpile @linera/client for client-side
  transpilePackages: ['@linera/client'],
}

module.exports = nextConfig
