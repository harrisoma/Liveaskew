import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import outfits from "@/assets/site/honey-outfits.jpg";

const EVENTS = [
  {
    time: "09:00",
    title: "A morning out",
    city: "Miami / California",
    look: "A sunlit start.",
    pieces: "Terracotta midi dress · Flat sandals · Woven bag",
    why: "An easy dress and comfortable flats, with warm textures for a relaxed morning.",
    position: "0%",
    alt: "Terracotta midi dress with tan sandals and a woven shoulder bag",
  },
  {
    time: "10:00",
    title: "The big meeting",
    city: "New York / Milan",
    look: "A fresh perspective.",
    pieces: "Blue button-down shirt · Chocolate skirt · Loafers",
    why: "A crisp shirt and a flowing skirt bring structure and movement to the working day.",
    position: "50%",
    alt: "Pale blue shirt, chocolate A-line skirt, black loafers and structured tan bag",
  },
  {
    time: "19:00",
    title: "Dinner with friends",
    city: "Paris",
    look: "Make an evening of it.",
    pieces: "Black midi dress · Burgundy slingbacks · Gold earrings",
    why: "A simple dress, rich accents and a little shine. An evening look with room to be yourself.",
    position: "100%",
    alt: "Black midi dress with burgundy slingbacks, evening bag and gold earrings",
  },
];

export function HoneyPreview() {
  const [selected, setSelected] = useState(1);
  const event = EVENTS[selected];
  return (
    <div className="honey-story">
      <div className="honey-agenda">
        <p className="ed-eyebrow">A day, beautifully put together</p>
        <h3>
          Your plans. <br />
          Your possibilities.
        </h3>
        <p className="ed-copy">Choose an occasion to explore a look.</p>
        <div className="honey-events" aria-label="Example calendar events">
          {EVENTS.map((item, i) => (
            <button
              key={item.title}
              type="button"
              aria-pressed={i === selected}
              aria-controls="honey-example-look"
              onClick={() => setSelected(i)}
            >
              <span>{item.time}</span>
              <strong>{item.title}</strong>
              {i === selected ? (
                <Check size={18} aria-hidden />
              ) : (
                <ArrowUpRight size={18} aria-hidden />
              )}
            </button>
          ))}
        </div>
        <p className="ed-note">
          Illustrative preview with AI-created imagery. Your own looks are tailored in Bee.
        </p>
      </div>
      <figure id="honey-example-look" className="honey-look" aria-live="polite" aria-atomic="true">
        <div className="honey-outfit">
          <img
            src={outfits}
            alt={event.alt}
            width={2172}
            height={724}
            loading="lazy"
            style={{ objectPosition: `${event.position} center` }}
          />
        </div>
        <figcaption>
          <p className="ed-eyebrow">Inspired by {event.city}</p>
          <h3>{event.look}</h3>
          <p className="honey-pieces">{event.pieces}</p>
          <p>{event.why}</p>
        </figcaption>
      </figure>
    </div>
  );
}
