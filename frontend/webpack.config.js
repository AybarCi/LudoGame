const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add alias for lottie-react-native on web
  config.resolve.alias = {
    ...config.resolve.alias,
    'lottie-react-native': require.resolve('./components/shared/LottieWrapper.js'),
  };

  return config;
};