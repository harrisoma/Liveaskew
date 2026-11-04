import type { Phase } from "../lib/storage";

const steps = [
  { phase: "profile", label: "Your details" },
  { phase: "interview", label: "Your style" },
  { phase: "selfie", label: "Your guide" },
] as const;

export function SetupProgress({ phase }: { phase: Phase }) {
  const current = steps.findIndex((step) => step.phase === phase);
  if (current < 0) return null;
  return (
    <nav aria-label="Account setup" className="mx-5 mt-3 mb-2 shrink-0">
      <ol className="neo-inset grid grid-cols-3 gap-2 p-3 text-xs">
        {steps.map((step, index) => (
          <li
            key={step.phase}
            aria-current={index === current ? "step" : undefined}
            className={index > current ? "opacity-50" : "font-semibold"}
          >
            <span aria-hidden="true">{index < current ? "✓" : index + 1} </span>
            {step.label}
            {index < current && <span className="sr-only"> completed</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
