import { Suspense } from "react";
import { RoomChat } from "@/components/RoomChat";

export default function MessagesPage() {
  return (
    <Suspense>
      <RoomChat />
    </Suspense>
  );
}
