import OrganizerClient from "@/components/scheduler/organizer-client";

export default async function OrganizerPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  return <OrganizerClient publicId={publicId} />;
}
