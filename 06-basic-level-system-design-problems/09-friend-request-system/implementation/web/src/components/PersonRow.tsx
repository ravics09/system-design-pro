"use client";

import type { PerspectiveStatus, User } from "../types";
import { STATUS_LABEL } from "../lib/status";
import {
  useRequestMutation,
  useRespondMutation,
  useCancelMutation,
  useUnfriendMutation,
  useBlockMutation,
  useUnblockMutation,
} from "../store/friendsApi";

/** One person + the actions available given the current relationship status. */
export function PersonRow({ user, status }: { user: User; status: PerspectiveStatus }) {
  const [request] = useRequestMutation();
  const [respond] = useRespondMutation();
  const [cancel] = useCancelMutation();
  const [unfriend] = useUnfriendMutation();
  const [block] = useBlockMutation();
  const [unblock] = useUnblockMutation();

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f2f2f2" }}>
      <div>
        <strong>{user.name}</strong>{" "}
        <span style={{ color: "#999", fontSize: 12 }}>@{user.id} · {STATUS_LABEL[status]}</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {status === "NONE" && (
          <>
            <button onClick={() => request(user.id)}>Add friend</button>
            <button onClick={() => block(user.id)}>Block</button>
          </>
        )}
        {status === "REQUEST_SENT" && <button onClick={() => cancel(user.id)}>Cancel request</button>}
        {status === "REQUEST_RECEIVED" && (
          <>
            <button onClick={() => respond({ otherId: user.id, action: "accept" })}>Accept</button>
            <button onClick={() => respond({ otherId: user.id, action: "decline" })}>Decline</button>
          </>
        )}
        {status === "FRIENDS" && (
          <>
            <button onClick={() => unfriend(user.id)}>Unfriend</button>
            <button onClick={() => block(user.id)}>Block</button>
          </>
        )}
        {status === "BLOCKED" && <button onClick={() => unblock(user.id)}>Unblock</button>}
        {status === "BLOCKED_BY" && <button disabled>Unavailable</button>}
      </div>
    </div>
  );
}
