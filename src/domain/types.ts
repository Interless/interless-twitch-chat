export type ChatRole = 'broadcaster' | 'moderator' | 'vip' | 'subscriber' | 'viewer';

export interface ChatBadge {
  type: string;
  version: string;
  url: string | null;
  description: string;
}

export interface TextFragment {
  type: 'text';
  text: string;
}

export interface EmoteFragment {
  type: 'emote';
  id: string;
  name: string;
  url: string;
}

export type MessageFragment = TextFragment | EmoteFragment;

export interface ChatUser {
  id: string;
  login: string;
  displayName: string;
  displayColor: string | null;
  badges: ChatBadge[];
  role: ChatRole;
}

export interface ChatMessage {
  id: string;
  user: ChatUser;
  text: string;
  fragments: MessageFragment[];
  createdAt: number;
  isAction: boolean;
}

export interface RoleAssets {
  characterUrl: string | null;
  decorationUrl: string | null;
}

export interface RoleTheme {
  enabled: boolean;
  bubbleColor: string;
  textColor: string;
  nameColor: string;
  borderColor: string;
  shadow: string;
  rotationOffset: number;
  effectEnabled: boolean;
  assets: RoleAssets;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface PlacementResult {
  x: number;
  y: number;
  rotation: number;
  collisionRect: Rectangle;
  attempts: number;
  usedFallback: boolean;
}

export type MessageLifecycleState = 'entering' | 'visible' | 'exiting' | 'removed';

export interface ActiveMessage {
  message: ChatMessage;
  lifecycle: MessageLifecycleState;
  placement: PlacementResult | null;
}

export interface GeneralConfig {
  displayTimeMs: number;
  maxMessages: number;
  minWidth: number;
  maxWidth: number;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  padding: number;
  borderRadius: number;
  borderWidth: number;
  showBadges: boolean;
  showUserName: boolean;
  hideCommands: boolean;
  ignoredUsers: string[];
}

export type EnterAnimation = 'pop' | 'fade' | 'slide';
export type ExitAnimation = 'fade' | 'shrink' | 'slide';

export interface AnimationConfig {
  enter: EnterAnimation;
  enterDurationMs: number;
  exit: ExitAnimation;
  exitDurationMs: number;
  idleIntensity: number;
}

export interface PlacementConfig {
  edgePadding: number;
  messageGap: number;
  maxAttempts: number;
  rotationMin: number;
  rotationMax: number;
  safeZones: Rectangle[];
}

export interface WidgetConfig {
  general: GeneralConfig;
  placement: PlacementConfig;
  animation: AnimationConfig;
  roleThemes: Record<ChatRole, RoleTheme>;
}

export interface StreamElementsWidgetLoadEvent {
  detail: {
    fieldData: unknown;
  };
}

export interface StreamElementsReceivedEvent {
  detail: {
    listener: unknown;
    event: unknown;
  };
}

export type NormalizedWidgetEvent =
  | { type: 'config-loaded'; config: WidgetConfig }
  | { type: 'message-received'; message: ChatMessage }
  | { type: 'message-deleted'; messageId: string }
  | { type: 'user-messages-deleted'; userId: string }
  | { type: 'chat-cleared' };
