import { Facebook, Instagram, Linkedin } from "lucide-react";

/** Labels are supplied beside each decorative logo in the network list. */
export function SocialIcon({ network }: { network: string }) {
  const props = { size: 17, "aria-hidden": true as const, className: "shrink-0" };
  if (network === "Instagram") return <Instagram {...props} />;
  if (network === "Facebook") return <Facebook {...props} />;
  if (network === "LinkedIn") return <Linkedin {...props} />;
  if (network === "X" || network === "Threads") {
    return (
      <img
        src={`/social/${network.toLowerCase()}.svg`}
        alt=""
        width={17}
        height={17}
        className="shrink-0 invert"
      />
    );
  }
  return null;
}
