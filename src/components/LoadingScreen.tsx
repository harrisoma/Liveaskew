import logo from "@/assets/askew-logo.png";

type Props = {
  label?: string;
  fullscreen?: boolean;
};

export function LoadingScreen({ label = "Loading", fullscreen = true }: Props) {
  return (
    <div
      className={
        fullscreen
          ? "flex min-h-screen w-full items-center justify-center bg-background"
          : "flex w-full items-center justify-center py-24"
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-6">
        <img
          src={logo}
          alt="LiveAskew"
          className="h-20 w-auto animate-pulse opacity-90 [animation-duration:1.6s]"
        />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

export default LoadingScreen;
