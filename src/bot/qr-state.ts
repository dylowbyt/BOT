export type BotStatus = "waiting_qr" | "authenticated" | "ready" | "disconnected";

interface QRState {
  qr: string | null;
  status: BotStatus;
  phone: string | null;
  name: string | null;
}

const state: QRState = {
  qr: null,
  status: "waiting_qr",
  phone: null,
  name: null,
};

export function setQR(qr: string): void {
  state.qr = qr;
  state.status = "waiting_qr";
}

export function setAuthenticated(): void {
  state.qr = null;
  state.status = "authenticated";
}

export function setReady(phone: string, name: string): void {
  state.qr = null;
  state.status = "ready";
  state.phone = phone;
  state.name = name;
}

export function setDisconnected(): void {
  state.status = "disconnected";
  state.qr = null;
}

export function getState(): Readonly<QRState> {
  return state;
}
