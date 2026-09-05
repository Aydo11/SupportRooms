import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { Thread } from "@/components/thread";
import { ConversationMenu } from "@/components/conversation-menu";

export const metadata = { title: "Conversation" };
export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/messages/${id}`);

  const participant = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
  });
  if (!participant) notFound();

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, title: true } },
      lookingForAd: { select: { id: true, title: true } },
      participants: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
    },
  });
  if (!conversation) notFound();

  await db.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
    data: { lastReadAt: new Date() },
  });
  await db.message.updateMany({
    where: { conversationId: id, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  const others = conversation.participants.filter((p) => p.userId !== user.id);
  const alreadyBlocked = others[0]
    ? Boolean(
        await db.block.findUnique({
          where: { blockerId_blockedId: { blockerId: user.id, blockedId: others[0].userId } },
        }),
      )
    : false;

  return (
    <div className="shell max-w-3xl py-6 lg:py-10">
      <Link href="/messages" className="text-[14px] text-ink-soft hover:text-ink">← All messages</Link>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="text-[22px]">
            {others.map((p) => `${p.user.firstName} ${p.user.lastName.charAt(0)}.`).join(", ") || "Conversation"}
          </h1>
          {conversation.listing && (
            <Link href={`/listings/${conversation.listing.id}`} className="text-[14px] text-pine-dark hover:underline">
              {conversation.listing.title}
            </Link>
          )}
          {conversation.lookingForAd && (
            <Link href={`/people/${conversation.lookingForAd.id}`} className="text-[14px] text-pine-dark hover:underline">
              {conversation.lookingForAd.title}
            </Link>
          )}
        </div>
        {others[0] && (
          <ConversationMenu
            otherUserId={others[0].userId}
            otherName={others[0].user.firstName}
            initiallyBlocked={alreadyBlocked}
          />
        )}
      </header>

      <Thread
        conversationId={conversation.id}
        currentUserId={user.id}
        initialMessages={conversation.messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
          readAt: m.readAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
