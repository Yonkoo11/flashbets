/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',          // Static HTML export for GitHub Pages
  basePath: '/flashbets',    // Repo name — GH Pages serves at /flashbets/
  trailingSlash: true,       // Required for static routing on GH Pages
  reactStrictMode: false,    // Disabled — timer double-execution with strict mode
  images: { unoptimized: true }, // next/image doesn't work in static export

  webpack: (config) => {
    // MetaMask SDK pulls in React Native async storage — stub it for browser
    config.resolve.alias['@react-native-async-storage/async-storage'] = false
    return config
  },
}

module.exports = nextConfig
