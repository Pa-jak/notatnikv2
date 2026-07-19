import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiError, request, type MutationOp } from "./api";

const QUEUE_KEY = "notatnik.mutationQueue";

export interface QueueCallbacks {
  onCountChange: (count: number) => void;
  onFlushed: (executedAny: boolean) => void;
  onAuthError: () => void;
}

let queue: MutationOp[] = [];
let callbacks: QueueCallbacks | null = null;
let inFlight = false;
let retryTimer: ReturnType<typeof setInterval> | null = null;

function notifyCount() {
  callbacks?.onCountChange(queue.length);
}

function startRetry() {
  if (retryTimer === null) {
    retryTimer = setInterval(() => void flush(), 20000);
  }
}

function stopRetry() {
  if (retryTimer !== null) {
    clearInterval(retryTimer);
    retryTimer = null;
  }
}

async function persist() {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function initQueue(cb: QueueCallbacks): Promise<void> {
  callbacks = cb;
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (raw) {
    try {
      queue = JSON.parse(raw);
    } catch {
      queue = [];
    }
  }
  notifyCount();
  if (queue.length > 0) {
    await flush();
  }

  if (
    typeof window !== "undefined" &&
    typeof window.addEventListener === "function"
  ) {
    window.addEventListener("online", () => void flush());
  }
}

export function pendingCount(): number {
  return queue.length;
}

export async function enqueue(op: MutationOp): Promise<void> {
  queue.push(op);
  await persist();
  notifyCount();
  void flush();
}

export async function clearQueue(): Promise<void> {
  queue = [];
  await persist();
  notifyCount();
  stopRetry();
}

export async function flush(): Promise<void> {
  if (inFlight || queue.length === 0 || callbacks === null) {
    return;
  }

  inFlight = true;
  let executedAny = false;

  try {
    while (queue.length > 0) {
      const op = queue[0]!;
      try {
        await request(op.method, op.path, op.body);
        queue.shift();
        await persist();
        notifyCount();
        executedAny = true;
      } catch (e) {
        if (e instanceof ApiError) {
          if (e.status === 0) {
            startRetry();
            return;
          }
          if (e.status === 401) {
            callbacks.onAuthError();
            return;
          }
          // Inny błąd HTTP: odrzucamy wpis (last-write-wins) i idziemy dalej.
          queue.shift();
          await persist();
          notifyCount();
        } else {
          startRetry();
          return;
        }
      }
    }
  } finally {
    inFlight = false;
  }

  stopRetry();
  callbacks.onFlushed(executedAny);
}
