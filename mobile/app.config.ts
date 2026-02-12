import "dotenv/config";

export default ({ config }: { config: any }) => ({
  ...config,
  ios: {
    ...(config.ios ?? {}),
    infoPlist: {
      ...(config.ios?.infoPlist ?? {}),
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
      },
    },
  },
  extra: {
    ...(config.extra ?? {}),
    API_URL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000",
  },
});