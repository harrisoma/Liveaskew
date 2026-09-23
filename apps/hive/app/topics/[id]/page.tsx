import { Conversation } from "@/components/Conversation";

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Conversation topicId={id} />;
}
