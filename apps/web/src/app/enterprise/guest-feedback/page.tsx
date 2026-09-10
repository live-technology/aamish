import { GuestFeedbackInbox, type GuestFeedbackParams } from "@/components/guest-feedback-inbox";

export default function Page({ searchParams }: { searchParams: GuestFeedbackParams }) {
  return <GuestFeedbackInbox searchParams={searchParams} workspace="enterprise" />;
}
