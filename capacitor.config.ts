import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "co.liveaskew.app",
  appName: "Bee",
  webDir: "dist",
  server: {
    androidScheme: "https",
    ...(process.env.CAPACITOR_SERVER_URL ? { url: process.env.CAPACITOR_SERVER_URL } : {}),
  },
  plugins: {
    StatusBar: {
      style: "DEFAULT",
      backgroundColor: "#f2f2f7",
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
