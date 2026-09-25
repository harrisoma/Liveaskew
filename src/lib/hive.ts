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
    id: "working-mom",
    name: "Working mom",
    line: "The school run and the meeting, in the same afternoon.",
  },
  {
    id: "family",
    name: "Family",
    line: "The people at the table, and what the day is actually for.",
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
    room: "Working mom",
    network: "Instagram",
    text: "Board meeting at ten, school run at three. One closet.",
  },
  {
    room: "Family",
    network: "Facebook",
    text: "Sunday lunch is at her mother's. Nothing fussy.",
  },
] as const;
