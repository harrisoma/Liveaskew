import { useState } from "react";
import type { StyleBlueprint } from "@/lib/style-blueprint";
import { lookPhoto, type GuideLook } from "../lib/storage";

/** Presentation uses saved member evidence; it never invents outfits or a personal photo. */
export function PersonalEdit({
  guide,
  looks,
  sample = false,
  memberName,
  portrait,
}: {
  guide: StyleBlueprint;
  looks: GuideLook[];
  sample?: boolean;
  memberName?: string;
  portrait?: string | null;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const lead = looks.find((look) => lookPhoto(look, null));
  const photo = (lead ? lookPhoto(lead, null) : null) ?? portrait ?? null;
  return (
    <section className="personal-edit" id="personal-edit" aria-labelledby="personal-edit-title">
      <div className="personal-edit-copy">
        <p className="personal-signature">
          Live<span>Askew</span> <small>Styled by Bee</small>
        </p>
        <p className="personal-section-label">
          {memberName?.trim() ? `${memberName.trim()}’s Personal Edit` : "The Personal Edit"}
        </p>
        <h1 id="personal-edit-title">{guide.title}</h1>
        <p className="personal-aesthetic">{guide.archetype}</p>
        <p className="personal-intro">{guide.intro}</p>
        <ul className="personal-intentions">
          {guide.intent.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <nav className="personal-chapters" aria-label="Your style guide chapters">
          <a href="#outfit-playbook">The Outfit Playbook</a>
          <a href="#studio-capsule">The Wardrobe Edit</a>
          <a href="#studio-silhouette">Fit & fabric</a>
          <a href="#studio-shopping">Shopping priorities</a>
          <a href="#studio-finishing">Finishing touches</a>
        </nav>
      </div>
      {sample ? (
        <figure className="personal-edit-photo">
          <div
            className="lookbook-sample-image"
            role="img"
            aria-label="AI-created sample outfit illustration"
          />
          <figcaption>
            Illustrative style direction <span>Fictional client</span>
          </figcaption>
        </figure>
      ) : photo && failed !== photo ? (
        <figure className="personal-edit-photo">
          <img
            src={photo}
            alt={
              lead
                ? `${memberName?.trim() || "Your"} outfit preview: ${lead.formula.join(", ")}`
                : `${memberName?.trim() || "Your"} profile photo`
            }
            onError={() => setFailed(photo)}
          />
          <figcaption>
            {lead?.title ?? "Your photo"}{" "}
            <span>{lead?.occasion ?? "Personal reference · not an outfit preview"}</span>
          </figcaption>
        </figure>
      ) : (
        <div className="personal-edit-notes">
          <h2>Your stylist’s notes</h2>
          <p>{guide.silhouette.basis}</p>
          <h3>Shape & proportion</h3>
          <ul>
            {guide.silhouette.cuts.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <p className="studio-fine">Your personal outfit images appear here when they’re ready.</p>
        </div>
      )}
    </section>
  );
}
