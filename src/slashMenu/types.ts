import { LexicalEditor } from "lexical";

export enum SlashMetaTypes {
  open = "open",
  close = "close",
  execute = "execute",
  nextItem = "nextItem",
  prevItem = "prevItem",
  openSubMenu = "openSubMenu",
  closeSubMenu = "closeSubMenu",
  inputChange = "inputChange",
}

export type ItemId = string | "root";
export type ItemType = "command" | "submenu";
export type MenuItem = {
  id: ItemId;
  label: string;
  type: ItemType;
  locked?: boolean;
};

export interface CommandItem extends MenuItem {
  type: "command";
  command: (editor: LexicalEditor) => void;
}

// eslint-disable-next-line no-use-before-define
export type MenuElement = CommandItem | SubMenu;

export interface SubMenu extends MenuItem {
  type: "submenu";
  elements: MenuElement[];
  callbackOnClose?: () => void;
}

export interface InitialState {
  selected: ItemId;
  filteredElements: MenuElement[];
  open: boolean;
  subMenuId?: ItemId;
  filter: string;
  elements: MenuElement[];
  ignoredKeys: string[];
  callbackOnClose?: () => void;
  domRect: undefined;
}

export interface BaseSlashMenuState {
  selected: ItemId;
  filteredElements: MenuElement[];
  open: boolean;
  subMenuId?: ItemId;
  filter: string;
  elements: MenuElement[];
  ignoredKeys: string[];
  callbackOnClose?: () => void;
  domRect: DOMRect | undefined;
}

// It wast SlashMenuState in prosemirror-slash-menu
// I renamed it because Lexical the whole thing will be 1 package
export interface SlashMenuState extends BaseSlashMenuState {
  initialState: InitialState;
}

// export type BaseSlashMenuState = Omit<SlashMenuState, "initialState">;

export interface SlashMenuMeta {
  type: SlashMetaTypes;
  element?: MenuElement;
  filter?: string;
}
export interface OpeningConditions {
  shouldOpen: (state: SlashMenuState, event: KeyboardEvent) => boolean;
  shouldClose: (state: SlashMenuState, event: KeyboardEvent) => boolean;
}
