"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { sendMessageAction } from "@/server/actions/engagement";
import { SubmitButton } from "./ui";

type ThreadMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

/**
 * Near-real-time via short polling — no websocket infrastructure needed to run
 * the app. Swap `poll()` for a subscription when you add Pusher/Ably/socket.io.
 */
export function Thread({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: ThreadMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [state, action] = useFormState(sendMessageAction, { ok: false });
  const endRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { messages: ThreadMessage[] };
        setMessages((current) => (data.messages.length === current.length ? current : data.messages));
      } catch {
        // Offline or navigating away — the next tick will retry.
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [conversationId]);

  return (
    <>
      <ol className="mt-6 space-y-3 pb-4">
        {messages.map((message) => {
          const mine = message.senderId === currentUserId;
          return (
            <li key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[80%] rounded-card px-4 py-2.5 ${
                  mine ? "bg-ink text-white" : "border border-line bg-white text-ink"
                }`}
              >
                <p className="whitespace-pre-line text-[15px] leading-relaxed">{message.body}</p>
                <p className={`mt-1 text-[12px] ${mine ? "text-white/60" : "text-ink-faint"}`}>
                  {new Date(message.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  {mine && message.readAt ? " · Read" : ""}
                </p>
              </div>
            </li>
          );
        })}
        <div ref={endRef} />
      </ol>

      <form
        ref={formRef}
        action={action}
        className="sticky bottom-20 flex gap-2 rounded-card border border-line bg-white p-2 lg:bottom-4"
      >
        <input type="hidden" name="conversationId" value={conversationId} />
        <label className="sr-only" htmlFor="body">Message</label>
        <textarea
          id="body"
          name="body"
          rows={1}
          required
          placeholder="Write a message"
          className="min-h-[46px] flex-1 resize-none rounded-[10px] border-0 px-3 py-3 text-[15px] focus:ring-0"
        />
        <SubmitButton className="btn-primary" pendingLabel="Sending">Send</SubmitButton>
      </form>
      {state.errors?.body && <p className="mt-2 text-[13px] text-clay">{state.errors.body}</p>}
    </>
  );
}
