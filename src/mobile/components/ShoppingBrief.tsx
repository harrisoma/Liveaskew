import { useState } from "react";
import { shoppingProfileSchema, type ShoppingProfile } from "@/lib/shopping-profile";
export function ShoppingBrief({
  initialProfile,
  onComplete,
  disabled = false,
}: {
  initialProfile?: ShoppingProfile | null;
  onComplete: (value: string) => void;
  disabled?: boolean;
}) {
  const [profile, setProfile] = useState<ShoppingProfile>(
    () => initialProfile ?? shoppingProfileSchema.parse({}),
  );
  const change = <K extends keyof ShoppingProfile>(key: K, value: ShoppingProfile[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));
  return (
    <form
      className="studio-brief"
      onSubmit={(e) => {
        e.preventDefault();
        onComplete(JSON.stringify(profile));
      }}
    >
      <h2>Your shopping details</h2>
      <p>
        Save these once for your Style Guide. Bee only shows live matches when a retailer confirms
        your listed size is available within your limits. Sizes are labels, not a fit guarantee.
      </p>
      <div className="studio-brief-fields">
        <label>
          Clothing department
          <select
            className="neo-input mt-2"
            value={profile.department}
            onChange={(e) => change("department", e.target.value as ShoppingProfile["department"])}
          >
            <option value="women">Women</option>
            <option value="men">Men</option>
            <option value="unisex">Unisex</option>
          </select>
        </label>
        <label>
          Shopping currency
          <select
            className="neo-input mt-2"
            value={profile.currency}
            onChange={(e) => change("currency", e.target.value as ShoppingProfile["currency"])}
          >
            {["USD", "CAD", "GBP", "EUR", "AUD"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        {(
          [
            ["topSize", "Top / jacket size"],
            ["bottomSize", "Trouser / skirt size"],
            ["dressSize", "Dress size"],
            ["shoeSize", "Shoe size"],
            ["bagSize", "Bag size preference (optional)"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              className="neo-input mt-2"
              value={profile[key]}
              maxLength={30}
              placeholder={
                key === "shoeSize"
                  ? "For example, 8"
                  : key === "bagSize"
                    ? "Any, Small, Medium or Large"
                    : "For example, M or 10"
              }
              onChange={(e) => change(key, e.target.value)}
            />
          </label>
        ))}
        <label>
          Shoe sizing system
          <select
            className="neo-input mt-2"
            value={profile.shoeSystem}
            onChange={(e) => change("shoeSystem", e.target.value as ShoppingProfile["shoeSystem"])}
          >
            {[
              ["US-women", "US women"],
              ["US-men", "US men"],
              ["UK", "UK"],
              ["EU", "EU"],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {(
          [
            ["clothingMax", "Maximum per clothing item"],
            ["shoeMax", "Maximum per pair of shoes"],
            ["accessoryMax", "Maximum per accessory"],
            ["totalMax", "Total new purchases budget before tax/shipping (optional)"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label} ({profile.currency})
            <input
              className="neo-input mt-2"
              type="number"
              min="0"
              max={key === "totalMax" ? 100000 : 10000}
              step="0.01"
              value={profile[key] || ""}
              placeholder="Leave blank to skip"
              onChange={(e) => change(key, Number(e.target.value))}
            />
          </label>
        ))}
      </div>
      <p className="studio-fine">
        Blank sizes or spending limits mean Bee won’t claim a match for that category. Current
        retailer coverage varies by market. Tax and shipping are added by the retailer.
      </p>
      <button className="studio-primary" type="submit" disabled={disabled}>
        Save interview & continue
      </button>
    </form>
  );
}
