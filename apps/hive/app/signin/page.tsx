import { SignInPanel } from "@/components/SignInPanel";
import { devLoginEnabled, providerStatus } from "@/lib/providers";

export default function SignInPage() {
  return <SignInPanel providers={providerStatus()} dev={devLoginEnabled()} />;
}
