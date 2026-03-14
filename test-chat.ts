import { chat } from "./src/lib/ai/gemini";
import type { ChatMessage } from "@/types";

async function run() {
  const history: ChatMessage[] = [];
  
  const pushUser = (content: string) => {
    history.push({ role: "user", content, timestamp: new Date().toISOString() });
    console.log(`\n\n=== USER ===\n${content}`);
  };

  const doChat = async () => {
    const res = await chat([...history]);
    history.push({
      role: "assistant",
      content: res.reply,
      timestamp: new Date().toISOString(),
      toolCalls: res.toolCalls,
    });
    console.log(`\n=== ASSISTANT ===\n${res.reply}`);
    if (res.toolCalls && res.toolCalls.length > 0) {
      console.log(`[Tool Calls]:`, res.toolCalls.map(t => t.name));
    }
  };

  pushUser("Hi, I need to book an appointment because I have a really bad stomach ache.");
  await doChat();

  pushUser("I'd like to see Dr. James Wilson as soon as possible.");
  await doChat();

  pushUser(`I want to do tomorrow morning. My name is Alex, email alex@example.com, phone 555-1234.`);
  await doChat();

  pushUser(`I'll take Monday March 16 at 9:00 AM with Dr. James Wilson.`);
  await doChat();
}

run().catch(console.error);
