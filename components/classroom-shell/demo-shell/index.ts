/**
 * B.1.3 — barrel export for the full 3-pane demo shell.
 *
 *   <DemoShell /> is the all-in-one container. Smaller widgets
 *   (<TopHeader />, <ChatHistory />, <AssignmentPanel />,
 *   <InputBar />) are exported individually so unit tests can mount
 *   them in isolation.
 */

export { DemoShell } from './demo-shell';
export type { DemoShellProps } from './demo-shell';
export { TopHeader } from './top-header';
export type { TopHeaderProps } from './top-header';
export { ChatHistory } from './chat-history';
export type { ChatHistoryProps } from './chat-history';
export { AssignmentPanel } from './assignment-panel';
export type { AssignmentPanelProps } from './assignment-panel';
export { InputBar } from './input-bar';
export type { InputBarProps } from './input-bar';
