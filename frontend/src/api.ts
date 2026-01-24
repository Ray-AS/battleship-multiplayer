import type { ApiError, AttackResponse, CreateGameResponse, PlaceShipRequest, PlaceShipResponse } from "./models";

const API_URL = "http://localhost:3000/game";

export const api = {
  createGame: (gameId: string, playerId: string, isMultiplayer: boolean): Promise<CreateGameResponse | ApiError> =>
    fetch(`${API_URL}/${gameId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, isMultiplayer }),
    }).then((r) => r.json()),

  placeShip: (
    id: string,
    body: PlaceShipRequest,
  ): Promise<PlaceShipResponse | ApiError> =>
    fetch(`${API_URL}/${id}/place`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  startGame: (id: string): Promise<AttackResponse> =>
    fetch(`${API_URL}/${id}/start`, { method: "POST" }).then((r) => r.json()),

  attack: (id: string, attackerId: string, x: number, y: number): Promise<AttackResponse> => 
    fetch(`${API_URL}/${id}/attack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attackerId, x, y }),
    }).then(r => r.json()),

  getGame: (id: string) => fetch(`${API_URL}/${id}`).then((r) => r.json()),
};
