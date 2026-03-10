/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled — timer double-execution with strict mode

  webpack: (config) => {
    // MetaMask SDK pulls in React Native async storage — stub it for browser
    config.resolve.alias['@react-native-async-storage/async-storage'] = false

    return config
  },
}

module.exports = nextConfig
