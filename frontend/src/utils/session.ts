import { v4 as uuidv4 } from "uuid";

const SESSION_KEY = "bs_session_player_id";

export function getSessionPlayerId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuidv4();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export const MY_ID = getSessionPlayerId();
