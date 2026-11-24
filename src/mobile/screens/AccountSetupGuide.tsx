import { Check, ChevronRight } from "lucide-react";
import { NeoButton } from "../components/ui";

export type SetupAction = "details" | "style" | "guide" | "social" | "privacy";
export function AccountSetupGuide({
  detailsReady,
  styleReady,
  guideReady,
  socialCount,
  onOpen,
}: {
  detailsReady: boolean;
  styleReady: boolean;
  guideReady: boolean;
  socialCount: number;
  onOpen: (step: SetupAction) => void;
}) {
  const steps: { id: SetupAction; title: string; detail: string; complete: boolean }[] = [
    {
      id: "details",
      title: "Your account details",
      detail: "Check your name, optional phone and saved social handles.",
      complete: detailsReady,
    },
    {
      id: "style",
      title: "Your style interview",
      detail: "Tell Bee what fits your life, comfort and personal style.",
      complete: styleReady,
    },
    {
      id: "guide",
      title: "Your Style Guide",
      detail: "Review your looks. Photo previews are optional AI features.",
      complete: guideReady,
    },
    {
      id: "social",
      title: "Connect your social accounts",
      detail: socialCount
        ? `${socialCount} connected. Review accounts and plan a post in Buzz.`
        : "Optional. Connect your own accounts in Buzz when you are ready to share.",
      complete: socialCount > 0,
    },
    {
      id: "privacy",
      title: "Review privacy and controls",
      detail: "Understand photo sharing, private groups and account deletion.",
      complete: false,
    },
  ];
  return (
    <section className="neo-raised p-4" aria-labelledby="setup-guide-title">
      <h2 id="setup-guide-title" className="text-xl font-semibold">
        Your account setup guide
      </h2>
      <p className="mt-2 text-sm opacity-75">
        Pick up where you left off. Optional steps never block you from using LiveAskew.
      </p>
      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <li key={step.id}>
            <NeoButton className="w-full text-left" onClick={() => onOpen(step.id)}>
              <span className="flex w-full items-center gap-3">
                <span aria-hidden>{step.complete ? <Check size={18} /> : `${index + 1}.`}</span>
                <span className="min-w-0 flex-1">
                  <strong className="block">{step.title}</strong>
                  <span className="block text-sm font-normal opacity-75">{step.detail}</span>
                  {step.complete && <span className="sr-only">Complete</span>}
                </span>
                <ChevronRight size={16} aria-hidden />
              </span>
            </NeoButton>
          </li>
        ))}
      </ol>
    </section>
  );
}
