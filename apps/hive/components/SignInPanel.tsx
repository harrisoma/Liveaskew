"use client";

import { signIn } from "next-auth/react";
import { Button, Card } from "@liveaskew/ui";
import type { ProviderId } from "@liveaskew/auth";

const MEMBER = {
  email: "member@liveaskew.com",
  name: "Amina Cole",
};

export function SignInPanel({
  providers,
  dev,
}: {
  providers: { id: ProviderId; label: string; configured: boolean }[];
  dev: boolean;
}) {
  return (
    <Card className="pad stack" style={{ maxWidth: 460 }}>
      <div>
        <p className="kicker">Universal sign-in</p>
        <h1
          style={{
            fontFamily: "Times New Roman, serif",
            fontWeight: 500,
            fontSize: "2.6rem",
            margin: "8px 0",
          }}
        >
          Any door. One member.
        </h1>
        <p className="muted">
          {dev
            ? "Local linking is on. Each platform joins the same Hive email."
            : "Each platform uses its own keys. Add them in the Hive environment to open that door."}
        </p>
      </div>
      {providers.map((provider) => {
        const live = dev || provider.configured;
        return (
          <Button
            key={provider.id}
            className="provider"
            disabled={!live}
            onClick={() => {
              if (dev) {
                void signIn("dev-link", {
                  provider: provider.id,
                  email: MEMBER.email,
                  name: MEMBER.name,
                  providerAccountId: `${provider.id}-amina`,
                  redirectTo: "/account",
                });
                return;
              }
              void signIn(provider.id, { redirectTo: "/account" });
            }}
          >
            Continue with {provider.label}
            {!live && " — add keys"}
          </Button>
        );
      })}
    </Card>
  );
}
