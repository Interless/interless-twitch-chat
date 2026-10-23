import type { ActiveMessage, MessageLifecycleState, WidgetConfig } from '../domain/types';

type TimeoutHandle = ReturnType<typeof setTimeout>;
type Schedule = (callback: () => void, delayMs: number) => TimeoutHandle;
type Cancel = (handle: TimeoutHandle) => void;

interface ScheduledMessage {
  signature: string;
  handles: TimeoutHandle[];
}

export class MessageLifecycleService {
  private readonly scheduled = new Map<string, ScheduledMessage>();

  public constructor(
    private readonly onStateChange: (messageId: string, state: MessageLifecycleState) => void,
    private readonly schedule: Schedule = (callback, delayMs) =>
      globalThis.setTimeout(callback, delayMs),
    private readonly cancel: Cancel = (handle) => globalThis.clearTimeout(handle),
  ) {}

  public sync(messages: ActiveMessage[], config: WidgetConfig, now = Date.now()): void {
    const activeIds = new Set(messages.map((active) => active.message.id));
    for (const [messageId, scheduled] of this.scheduled) {
      if (!activeIds.has(messageId)) {
        scheduled.handles.forEach((handle) => this.cancel(handle));
        this.scheduled.delete(messageId);
      }
    }

    for (const active of messages) {
      const signature = [
        active.message.createdAt,
        config.animation.enterDurationMs,
        config.general.displayTimeMs,
        config.animation.exitDurationMs,
      ].join(':');
      const existing = this.scheduled.get(active.message.id);
      if (existing?.signature === signature) continue;
      existing?.handles.forEach((handle) => this.cancel(handle));

      const age = Math.max(0, now - active.message.createdAt);
      const timeline: [MessageLifecycleState, number][] = [
        ['visible', config.animation.enterDurationMs],
        ['exiting', config.general.displayTimeMs],
        ['removed', config.general.displayTimeMs + config.animation.exitDurationMs],
      ];
      const handles = timeline.map(([state, at]) =>
        this.schedule(() => this.onStateChange(active.message.id, state), Math.max(0, at - age)),
      );
      this.scheduled.set(active.message.id, { signature, handles });
    }
  }

  public dispose(): void {
    for (const scheduled of this.scheduled.values()) {
      scheduled.handles.forEach((handle) => this.cancel(handle));
    }
    this.scheduled.clear();
  }
}
