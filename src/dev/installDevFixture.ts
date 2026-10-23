const USERS = [
  { nick: 'captain', displayName: 'Captain', badges: ['broadcaster'] },
  { nick: 'leadmod', displayName: 'LeadMod', badges: ['lead_moderator'] },
  { nick: 'modbone', displayName: 'ModBone', badges: ['moderator'] },
  { nick: 'violetvip', displayName: 'VioletVIP', badges: ['vip'] },
  { nick: 'subscriber', displayName: 'Subscriber', badges: ['subscriber'] },
  { nick: 'viewer', displayName: 'Viewer', badges: [] },
] as const;

const TEXTS = [
  'Neutral development fixture',
  'A longer line verifies wrapping without becoming a separate preview product.',
  'Unicode: Привет 👋 مرحباً',
  '<img src=x onerror=alert(1)> stays text',
] as const;

export function installDevFixture(): () => void {
  let index = 0;
  let interval: number | null = null;
  const emit = () => {
    const user = USERS[index % USERS.length] ?? USERS[0];
    const text = TEXTS[index % TEXTS.length] ?? TEXTS[0];
    const id = `dev-message-${String(index)}`;
    window.dispatchEvent(
      new CustomEvent('onEventReceived', {
        detail: {
          listener: 'message',
          event: {
            data: {
              time: Date.now(),
              tags: { badges: user.badges.map((badge) => `${badge}/1`).join(',') },
              nick: user.nick,
              userId: `dev-user-${String(index % USERS.length)}`,
              displayName: user.displayName,
              badges: user.badges.map((badge) => ({ type: badge, version: '1' })),
              text,
              emotes: [],
              msgId: id,
            },
          },
        },
      }),
    );
    index += 1;
  };

  const start = () => {
    window.dispatchEvent(
      new CustomEvent('onWidgetLoad', {
        detail: { fieldData: { displayTimeSeconds: 30, maxMessages: 8 } },
      }),
    );
    emit();
    interval = window.setInterval(emit, 2200);
  };

  const startTimeout = window.setTimeout(start, 0);
  return () => {
    window.clearTimeout(startTimeout);
    if (interval !== null) window.clearInterval(interval);
  };
}
