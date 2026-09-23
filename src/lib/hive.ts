export const HIVE_NETWORKS = ["Instagram", "Facebook", "TikTok"] as const;

export const HIVE_ROOMS = [
  {
    id: "motherhood",
    name: "Motherhood",
    line: "The week as it actually is — school runs, rest, and what still gets worn.",
  },
  {
    id: "style",
    name: "Style",
    line: "Fit, Feel, and Fabric, talked through with other clients.",
  },
  {
    id: "everyday",
    name: "Everyday",
    line: "Weather, work, errands, and the clothes that survive them.",
  },
  {
    id: "editorial",
    name: "Editorial",
    line: "Longer reads. A look, a cloth, a point of view.",
  },
] as const;

export const HIVE_THREADS = [
  {
    room: "Motherhood",
    network: "Instagram",
    text: "The coat from yesterday still works for pickup. I need pockets more than a new silhouette.",
  },
  {
    room: "Style",
    network: "TikTok",
    text: "Wool that holds, silk that breathes. That is the whole brief for this week.",
  },
  {
    room: "Everyday",
    network: "Instagram",
    text: "Rain until Thursday. Who is keeping the shoe and swapping only the layer?",
  },
  {
    room: "Editorial",
    network: "Facebook",
    text: "A covered neckline can still be the sharpest thing in the room. The cloth does the talking.",
  },
] as const;
