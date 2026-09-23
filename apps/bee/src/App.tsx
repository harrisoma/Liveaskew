import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  planOutfit,
  rankWardrobe,
  transferLook,
  type BodyStage,
  type Occasion,
  type Platform,
  type WardrobeItem,
} from "@liveaskew/api-client";
import { tokens } from "@liveaskew/ui/tokens";

const STAGES: BodyStage[] = ["maternity", "postpartum", "everyday"];
const OCCASIONS: { id: Occasion; label: string }[] = [
  { id: "school-run", label: "School run" },
  { id: "maternity-day", label: "Maternity day" },
  { id: "boardroom", label: "Boardroom" },
  { id: "weekend", label: "Weekend" },
];
const PLATFORMS: Platform[] = ["instagram", "tiktok", "pinterest", "facebook", "linkedin"];

const WARDROBE: WardrobeItem[] = [
  { id: "blazer", label: "Stretch wool blazer", tags: ["blazer", "stretch", "tailored"] },
  { id: "silk", label: "Ivory silk shell", tags: ["silk", "tailored"] },
  { id: "trouser", label: "Support-waist trouser", tags: ["trouser", "stretch"] },
  { id: "knit", label: "Fine knit", tags: ["knit"] },
  { id: "jean", label: "Under-bump jean", tags: ["jean", "stretch"] },
  { id: "coat", label: "Long knit coat", tags: ["coat", "knit"] },
];

const BUZZ = process.env.EXPO_PUBLIC_BUZZ_URL ?? "https://buzz.liveaskew.com";

export default function App() {
  const [stage, setStage] = useState<BodyStage>("maternity");
  const [occasion, setOccasion] = useState<Occasion>("boardroom");
  const [platforms, setPlatforms] = useState<Platform[]>(["instagram", "linkedin"]);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");

  const plan = useMemo(() => planOutfit({ occasion, stage }), [occasion, stage]);
  const wardrobe = useMemo(
    () =>
      rankWardrobe(
        WARDROBE,
        plan.pieces.flatMap((piece) => piece.item.toLowerCase().split(" ")),
      ),
    [plan],
  );

  async function send() {
    setStatus("Sending to Buzz…");
    try {
      await transferLook(BUZZ, {
        lookId: `${Date.now()}`,
        userId: "bee-member",
        imageUrl: "https://bee.liveaskew.com/look",
        caption:
          `${plan.title}. ${plan.pieces.map((piece) => piece.item).join(", ")}. ${note}`.trim(),
        platforms,
        source: "bee",
      });
      setStatus("Buzz has the look.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Buzz did not take the look.");
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <StatusBar style="light" />
      {/* Expo resolves the crest at bundle time. */}
      {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
      <Image source={require("../assets/bee.png")} style={styles.crest} />
      <Text style={styles.kicker}>Bee by LiveAskew</Text>
      <Text style={styles.title}>Clothes follow the body.</Text>
      <Text style={styles.copy}>
        Working mothers. Maternity to the boardroom. The wardrobe you already own.
      </Text>

      <Text style={styles.label}>Body</Text>
      <View style={styles.row}>
        {STAGES.map((item) => (
          <Pressable
            key={item}
            style={[styles.chip, item === stage && styles.chipOn]}
            onPress={() => setStage(item)}
          >
            <Text style={styles.chipText}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Day</Text>
      <View style={styles.row}>
        {OCCASIONS.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.chip, item.id === occasion && styles.chipOn]}
            onPress={() => setOccasion(item.id)}
          >
            <Text style={styles.chipText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.plan}>{plan.title}</Text>
        <Text style={styles.copy}>{plan.note}</Text>
        {plan.pieces.map((piece) => (
          <Text key={piece.role} style={styles.piece}>
            {piece.role} · {piece.item}
            {"\n"}
            <Text style={styles.why}>{piece.why}</Text>
          </Text>
        ))}
      </View>

      <Text style={styles.label}>From the wardrobe</Text>
      {wardrobe.slice(0, 3).map((item) => (
        <Text key={item.id} style={styles.piece}>
          {item.label}
        </Text>
      ))}

      <Text style={styles.label}>Send to Buzz</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Anything Buzz should say"
        placeholderTextColor={tokens.goldDeep}
        style={styles.input}
      />
      <View style={styles.row}>
        {PLATFORMS.map((platform) => {
          const on = platforms.includes(platform);
          return (
            <Pressable
              key={platform}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() =>
                setPlatforms((current) =>
                  current.includes(platform)
                    ? current.filter((item) => item !== platform)
                    : [...current, platform],
                )
              }
            >
              <Text style={styles.chipText}>{platform}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={styles.send} onPress={() => void send()}>
        <Text style={styles.sendText}>Transfer look</Text>
      </Pressable>
      {status ? <Text style={styles.copy}>{status}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.black },
  content: { padding: 22, paddingTop: 64, gap: 10 },
  crest: { width: 96, height: 96, borderRadius: 48 },
  kicker: { color: tokens.gold, letterSpacing: 2, textTransform: "uppercase", fontSize: 12 },
  title: { color: tokens.paper, fontSize: 36, lineHeight: 40 },
  copy: { color: tokens.muted, fontSize: 15, lineHeight: 22 },
  label: {
    color: tokens.gold,
    marginTop: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 12,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderColor: tokens.line,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipOn: { backgroundColor: "#1c1c1c" },
  chipText: { color: tokens.paper, fontSize: 13 },
  card: {
    marginTop: 8,
    padding: 16,
    borderRadius: 24,
    borderColor: tokens.line,
    borderWidth: 1,
    backgroundColor: tokens.raised,
    gap: 8,
  },
  plan: { color: tokens.paper, fontSize: 22 },
  piece: { color: tokens.paper, fontSize: 15, lineHeight: 22 },
  why: { color: tokens.muted },
  input: {
    borderColor: tokens.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    color: tokens.paper,
  },
  send: {
    marginTop: 8,
    backgroundColor: "#141414",
    borderRadius: 999,
    padding: 14,
    alignItems: "center",
    borderColor: tokens.line,
    borderWidth: 1,
  },
  sendText: { color: tokens.gold, letterSpacing: 2, textTransform: "uppercase" },
});
