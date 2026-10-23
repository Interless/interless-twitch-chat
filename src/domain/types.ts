import type paletteTokens from '../config/paletteTokens.json';
import type decorationIcons from '../config/decorationIcons.json';

export type PaletteKey = keyof typeof paletteTokens;
export type CustomColors = Partial<Record<PaletteKey, string>>;
export type DecorationKind = keyof typeof decorationIcons;

export interface DecorationConfig {
  enabled: boolean;
  icons: DecorationKind[];
  density: number;
  chance: number;
  frequency: number;
  opacity: number;
}

export type ChatRole =
  'broadcaster' | 'lead_moderator' | 'moderator' | 'vip' | 'subscriber' | 'viewer';

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
  headerColor: string;
  textColor: string;
  nameColor: string;
  borderColor: string;
  shadow: string;
  effectEnabled: boolean;
  assets: RoleAssets;
}

export type MessageLifecycleState = 'entering' | 'visible' | 'exiting' | 'removed';

export interface ActiveMessage {
  message: ChatMessage;
  lifecycle: MessageLifecycleState;
  side: 'left' | 'right';
  characterId: string | null;
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
export type IdleMotion = 'off' | 'float' | 'pixel' | 'chaotic';

export interface AnimationConfig {
  enter: EnterAnimation;
  enterDurationMs: number;
  exit: ExitAnimation;
  exitDurationMs: number;
  idleIntensity: number;
  idleMotion: IdleMotion;
  idleFrequency: number;
}

export type ChatAlignment = 'left' | 'center' | 'right';

export interface Dinosaur {
  name: string;
  characterUrl: string | null;
}

export interface LayoutConfig {
  scale: number;
  alignment: ChatAlignment;
  horizontalOffset: number;
  bottomOffset: number;
  messageGap: number;
  characterSide: 'alternating' | 'left' | 'right';
  characterSize: number;
}

export interface AppearanceConfig {
  customColors?: CustomColors;
  colorScheme: 'roles' | 'light' | 'dark';
  bubbleOpacity: number;
  headerOpacity: number;
}

export interface WidgetConfig {
  decorations: DecorationConfig;
  appearance: AppearanceConfig;
  general: GeneralConfig;
  layout: LayoutConfig;
  animation: AnimationConfig;
  roleThemes: Record<ChatRole, RoleTheme>;
  dinosaurs: Record<string, Dinosaur>;
  userDinosaurs: Record<string, string>;
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
  | { type: 'preview-characters-selected'; characterIds: string[]; userId?: string }
  | { type: 'config-loaded'; config: WidgetConfig }
  | { type: 'message-received'; message: ChatMessage }
  | { type: 'message-deleted'; messageId: string }
  | { type: 'user-messages-deleted'; userId: string }
  | { type: 'chat-cleared' };
