import { ItemId, MenuElement, BaseSlashMenuState, SubMenu } from "./types";

export function getDOMRangeRect(
  nativeSelection: Selection,
  rootElement: HTMLElement
): DOMRect {
  const domRange = nativeSelection.getRangeAt(0);

  let rect;

  if (nativeSelection.anchorNode === rootElement) {
    let inner = rootElement;
    while (inner.firstElementChild != null) {
      inner = inner.firstElementChild as HTMLElement;
    }
    rect = inner.getBoundingClientRect();
  } else {
    rect = domRange.getBoundingClientRect();
  }

  return rect;
}

export const getElementIds = (item: MenuElement): ItemId[] => {
  if (item.type === "submenu")
    return [
      item.id,
      ...item.elements.map((item) => getElementIds(item)),
    ].flat();
  return [item.id];
};

export const getAllElementIds = (config: BaseSlashMenuState) =>
  config.filteredElements.map((element) => getElementIds(element)).flat();

export const hasDuplicateIds = (config: BaseSlashMenuState): boolean => {
  const ids = getAllElementIds(config);

  return ids.length !== new Set(ids).size;
};

const getElements = (item: MenuElement): MenuElement[] => {
  if (item.type === "submenu") {
    return [item, ...item.elements.map((item) => getElements(item))].flat();
  }

  return [item];
};

export const getAllElements = (state: BaseSlashMenuState) =>
  state.elements.map((element) => getElements(element)).flat();

export const getElementById = (id: ItemId, state: BaseSlashMenuState) => {
  return getAllElements(state).find((element) => element.id === id);
};

export const findParent = (
  id: ItemId,
  elements: MenuElement[],
  subMenu: ItemId | "root" = "root"
): ItemId | "root" => {
  let parentId: ItemId = "root";

  elements.forEach((item) => {
    if (item.type === "submenu") {
      if (item.id === id) {
        parentId = subMenu;
      }
      const elementIds = item.elements.map((item) => item.id);
      if (elementIds.includes(id)) {
        parentId = item.id;
      } else {
        parentId = findParent(id, item.elements, item.id);
      }
    }

    if (item.id === id) {
      parentId = subMenu;
    }
  });

  return parentId;
};

export const getNextItemId = (
  state: BaseSlashMenuState
): ItemId | undefined => {
  const parentId = findParent(state.selected, state.filteredElements);
  const parent = getElementById(parentId, state);

  if (parentId === "root") {
    const nextItemIndex =
      state.filteredElements.findIndex(
        (element) => element.id === state.selected
      ) + 1;
    if (nextItemIndex < state.filteredElements.length) {
      return state.filteredElements[nextItemIndex].id;
    }
  }

  if (parent && parent.type === "submenu") {
    const nextItemIndex =
      parent.elements.findIndex((element) => element.id === state.selected) + 1;
    if (nextItemIndex < parent.elements.length) {
      return parent.elements[nextItemIndex].id;
    }
  }

  return undefined;
};

export const getPreviousItemId = (
  state: BaseSlashMenuState
): ItemId | undefined => {
  const parentId = findParent(state.selected, state.filteredElements);
  const parent = getElementById(parentId, state);

  if (parentId === "root") {
    const prevItemIndex =
      state.filteredElements.findIndex(
        (element) => element.id === state.selected
      ) - 1;
    if (prevItemIndex >= 0) {
      return state.filteredElements[prevItemIndex].id;
    }
  }

  if (parent && parent.type === "submenu") {
    const prevItemIndex =
      parent.elements.findIndex((element) => element.id === state.selected) - 1;
    if (prevItemIndex >= 0) {
      return parent.elements[prevItemIndex].id;
    }
  }

  return undefined;
};

export const getFilteredItems = (state: BaseSlashMenuState, input: string) => {
  const regExp = new RegExp(`${input.toLowerCase().replace(/\s/g, "\\s")}`);

  if (state.subMenuId && state.subMenuId !== "root") {
    const submenu = getElementById(state.subMenuId, state) as SubMenu;
    return submenu.elements.filter(
      (element) => element.label.toLowerCase().match(regExp) !== null
    );
  }

  return state.elements.filter(
    (element) =>
      element.label.toLowerCase().match(regExp) !== null && !element.locked
  );
};

export const defaultIgnoredKeys = [
  "Unidentified",
  "Alt",
  "AltGraph",
  "CapsLock",
  "Control",
  "Fn",
  "FnLock",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  "F12",
  "F13",
  "F14",
  "F15",
  "F16",
  "F17",
  "F18",
  "F19",
  "F20",
  "F21",
  "F22",
  "F23",
  "F24",
  "Hyper",
  "Meta",
  "NumLock",
  "PageDown",
  "PageUp",
  "Pause",
  "PrintScreen",
  "Redo",
  "ScrollLock",
  "Shift",
  "Super",
  "Symbol",
  "SymbolLock",
  "Enter",
  "Tab",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  "Backspace",
  "Clear",
  "Copy",
  "CrSel",
  "Cut",
  "Delete",
  "EraseEof",
  "ExSel",
  "Insert",
  "Paste",
  "Redo",
  "Undo",
  "Accept",
  "Again",
  "Attn",
  "Cancel",
  "ContextMenu",
  "Escape",
  "Execute",
  "Find",
  "Finish",
  "Help",
  "Pause",
  "Play",
  "Props",
  "Select",
  "ZoomIn",
  "ZoomOut",
  "BrightnessDown",
  "BrightnessUp",
  "Eject",
  "LogOff",
  "Power",
  "PowerOff",
  "PrintScreen",
  "Hibernate",
  "Standby",
  "WakeUp",
  "AllCandidates",
  "Alphanumeric",
  "CodeInput",
  "Compose",
  "Convert",
  "Dead",
  "FinalMode",
  "GroupFirst",
  "GroupLast",
  "GroupNext",
  "GroupPrevious",
  "ModeChange",
  "NextCandidate",
  "NonConvert",
  "PreviousCandidate",
  "Process",
  "SingleCandidate",
  "HangulMode",
  "HanjaMode",
  "JunjaMode",
  "Eisu",
  "Hankaku",
  "Hiragana",
  "HiraganaKatakana",
  "KanaMode",
  "KanjiMode",
  "Katakana",
  "Romaji",
  "Zenkaku",
  "ZenkakuHanaku",
];
