// Clean repetitive AI openers from all existing bot posts
// Run with: npx tsx scripts/cleanup-alright-listen.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function cleanContent(raw: string): string {
  let content = raw;

  // "Alright" — drop entire first sentence
  if (/^alright\b/i.test(content)) {
    const sentenceEnd = content.match(/[.!?]\s+(?=[A-Z])/);
    if (sentenceEnd && sentenceEnd.index !== undefined) {
      content = content.slice(sentenceEnd.index + sentenceEnd[0].length);
    } else {
      return ""; // single filler sentence, skip this post
    }
  }

  // Filler words at start — strip word only
  content = content.replace(/^(look|listen|okay|ok|so|honestly|frankly|real talk)[,;:.]?\s+/i, "");

  // Filler phrases — strip phrase, keep substance
  content = content.replace(/^I['\u2019]m looking at\s+/i, "");
  content = content.replace(/^let['\u2019]s talk about\s+/i, "");
  content = content.replace(/^let me tell you\s+/i, "");
  content = content.replace(/^here['\u2019]s the thing[,:.!]?\s*/i, "");
  content = content.replace(/^can we talk about\s+/i, "");
  content = content.replace(/^let['\u2019]s\s+(shift focus to|get real about|be honest about|be real about|get into|break down)\s+/i, "");

  content = content.trim();
  if (content.length > 0) {
    content = content.charAt(0).toUpperCase() + content.slice(1);
  }
  return content;
}

async function main() {
  const allTakes = await prisma.take.findMany({
    where: {
      isDeleted: false,
      OR: [
        { content: { startsWith: "Alright" } },
        { content: { startsWith: "alright" } },
        { content: { startsWith: "I'm looking at" } },
        { content: { startsWith: "I\u2019m looking at" } },
        { content: { startsWith: "Listen," } },
        { content: { startsWith: "Listen " } },
        { content: { startsWith: "Look," } },
        { content: { startsWith: "Look " } },
        { content: { startsWith: "Let's talk about" } },
        { content: { startsWith: "Let me tell you" } },
        { content: { startsWith: "Here's the thing" } },
        { content: { startsWith: "So," } },
        { content: { startsWith: "So " } },
        { content: { startsWith: "Honestly," } },
      ],
    },
    select: { id: true, content: true },
  });

  console.log(`Found ${allTakes.length} posts with repetitive openers\n`);

  let updated = 0;
  let skipped = 0;
  for (const take of allTakes) {
    const cleaned = cleanContent(take.content);
    if (cleaned === "" || cleaned.length < 10) {
      skipped++;
      continue; // Don't delete posts, just skip ones that would become empty
    }
    if (cleaned !== take.content) {
      await prisma.take.update({
        where: { id: take.id },
        data: { content: cleaned },
      });
      console.log(`  Fixed: "${take.content.slice(0, 60)}..." -> "${cleaned.slice(0, 60)}..."`);
      updated++;
    }
  }

  console.log(`\nDone! Updated ${updated}, skipped ${skipped} of ${allTakes.length} posts.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
