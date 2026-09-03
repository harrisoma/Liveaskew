import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "co.liveaskew.app",
  appName: "Bee",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#e0e5ec",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Camera: {
      presentationStyle: "popover",
    },
  },
};

export default config;
