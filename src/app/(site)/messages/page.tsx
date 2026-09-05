import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { EmptyState } from "@/components/ui";
import { initials, timeAgo } from "@/lib/format";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await requireUser("/messages");

  const conversations = await db.conversation.findMany({
    where: { participants: { some: { userId: user.id, archived: false } } },
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      participants: {
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      },
      listing: { select: { id: true, title: true } },
    },
  });

  const mine = new Map(
    conversations.map((c) => [c.id, c.participants.find((p) => p.userId === user.id)]),
  );

  return (
    <div className="shell max-w-3xl py-10">
      <h1 className="text-[30px]">Messages</h1>

      {conversations.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No conversations yet"
            body="When you message a provider about an advert — or they message you — the thread appears here."
            actionHref="/search"
            actionLabel="Search accommodation"
          />
        </div>
      ) : (
        <ul className="card mt-6 divide-y divide-line">
          {conversations.map((conversation) => {
            const others = conversation.participants.filter((p) => p.userId !== user.id);
            const last = conversation.messages[0];
            const participant = mine.get(conversation.id);
            const unread =
              last &&
              last.senderId !== user.id &&
              (!participant?.lastReadAt || participant.lastReadAt < last.createdAt);

            return (
              <li key={conversation.id}>
                <Link href={`/messages/${conversation.id}`} className="flex gap-4 px-4 py-4 hover:bg-paper">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper-sunk text-[15px] text-ink-soft">
                    {others[0] ? initials(others[0].user.firstName, others[0].user.lastName) : "?"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={`truncate text-[15px] ${unread ? "font-semibold text-ink" : "text-ink"}`}>
                        {others.map((p) => p.user.firstName).join(", ") || "Conversation"}
                      </span>
                      <span className="shrink-0 text-[13px] text-ink-faint">{timeAgo(conversation.lastMessageAt)}</span>
                    </span>
                    {conversation.subject && (
                      <span className="mt-0.5 block truncate text-[13px] text-ink-faint">
                        About: {conversation.subject}
                      </span>
                    )}
                    {last && (
                      <span className={`mt-1 block truncate text-[14px] ${unread ? "text-ink" : "text-ink-soft"}`}>
                        {last.senderId === user.id ? "You: " : ""}
                        {last.body}
                      </span>
                    )}
                  </span>
                  {unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-pine" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
