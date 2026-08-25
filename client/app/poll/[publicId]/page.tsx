import PublicPollClient from "@/components/scheduler/public-poll-client";

export default async function PollPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  return <PublicPollClient publicId={publicId} />;
}
