// src/lib/notify-new-member.ts
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Get Owner/Admin email addresses from:
 * communities/{communityId}/members where role in ['owner','admin']
 * Each member doc should have: { role: 'owner'|'admin', email: string }
 */
async function getAdminOwnerEmails(communityId: string): Promise<string[]> {
  const emails = new Set<string>();

  // Query members with role in ['owner', 'admin']
  const membersRef = collection(db, "communities", communityId, "members");
  const q = query(membersRef, where("role", "in", ["owner", "admin"]));
  const snap = await getDocs(q);

  snap.forEach((d) => {
    const data = d.data() as any;
    if (typeof data?.email === "string" && data.email.includes("@")) {
      emails.add(data.email);
    }
  });

  return [...emails];
}

/**
 * Call this right AFTER a user successfully joins a community (invite accepted,
 * manual add finished, or onboarding completed).
 *
 * It writes to /mail so the Trigger Email extension sends the message.
 */
export async function notifyAdminsOwnerNewMember(args: {
  communityId: string;
  communityName: string;
  memberUid: string;
  memberEmail?: string | null;
  memberDisplayName?: string | null;
}) {
  const { communityId, communityName, memberUid, memberEmail, memberDisplayName } = args;

  const to = await getAdminOwnerEmails(communityId);
  if (to.length === 0) return; // nothing to send

  const who = memberDisplayName || memberEmail || memberUid;

  await addDoc(collection(db, "mail"), {
    to, // array of admin/owner emails
    message: {
      subject: `New member joined ${communityName}`,
      text: `${who} just joined ${communityName}.\nMember ID: ${memberUid}${
        memberEmail ? `, Email: ${memberEmail}` : ""
      }`,
      html: `
        <p><strong>${who}</strong> just joined <strong>${communityName}</strong>.</p>
        <ul>
          <li>Member ID: ${memberUid}</li>
          ${memberEmail ? `<li>Email: ${memberEmail}</li>` : ""}
        </ul>
      `,
    },
    meta: {
      kind: "new-member",
      communityId,
      memberUid,
      createdAt: serverTimestamp(),
    },
  });
}