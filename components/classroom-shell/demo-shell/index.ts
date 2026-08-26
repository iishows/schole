/**
 * B.1.5 — barrel export for the full 3-pane demo shell.
 *
 *   <DemoShell /> is the all-in-one container. Smaller widgets
 *   (<TopHeader />, <ChatHistory />, <AssignmentPanel />,
 *   <InputBar />, <WhiteboardFullscreenView />) are exported
 *   individually so unit tests can mount them in isolation.
 */

export { DemoShell } from './demo-shell';
export type { DemoShellProps } from './demo-shell';
export { TopHeader, DEMO_VIEW_TABS } from './top-header';
export type { TopHeaderProps, DemoViewId, DemoViewTab } from './top-header';
export { ChatHistory } from './chat-history';
export type { ChatHistoryProps } from './chat-history';
export { AssignmentPanel } from './assignment-panel';
export type { AssignmentPanelProps } from './assignment-panel';
export { InputBar } from './input-bar';
export type { InputBarProps } from './input-bar';
export { WhiteboardFullscreenView } from './whiteboard-fullscreen-view';
export type { WhiteboardFullscreenViewProps } from './whiteboard-fullscreen-view';
