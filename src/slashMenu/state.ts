import {
  findParent,
  getElementById,
  getFilteredItems,
  getNextItemId,
  getPreviousItemId,
} from "./utils";
import {
  SlashMenuMeta,
  SlashMenuState,
  SlashMetaTypes,
  SubMenu,
} from "./types";

export const CLOSE_WHOLE_MENU = (state: SlashMenuState): SlashMenuState => {
  const callback = state.initialState.callbackOnClose;
  if (callback) {
    callback();
  }
  return {
    initialState: state.initialState,
    ...state.initialState,
  };
};
export const OPEN_SUB_MENU =
  (meta: SlashMenuMeta) =>
  (state: SlashMenuState): SlashMenuState => {
    const menuElement = meta.element;
    if (menuElement?.type === "submenu") {
      return {
        ...state,
        open: true,
        filteredElements: menuElement.elements,
        selected: menuElement.elements[0].id,
        subMenuId: menuElement.id,
      };
    }
    return state;
  };

export const CLOSE_SUBMENU = (
  state: SlashMenuState,
  meta: SlashMenuMeta
): SlashMenuState => {
  const menuElement = meta.element as SubMenu;
  const callback = menuElement.callbackOnClose;
  if (callback) {
    callback();
  }
  if (menuElement?.type === "submenu") {
    const parentId = findParent(
      menuElement.id,
      state.initialState.filteredElements
    );
    if (parentId === "root") {
      return {
        ...state.initialState,
        initialState: state.initialState,
        open: true,
      };
    }
    const parent = getElementById(parentId, state.initialState);
    if (parent?.type !== "submenu") return state;
    return {
      ...state,
      filteredElements: parent.elements,
      selected: parent.elements[0].id,
      subMenuId: parentId,
    };
  }
  return state;
};

export const SELECT_NEXT_ITEM = (state: SlashMenuState) => {
  const nextId = getNextItemId(state);
  if (!nextId) return state;
  return { ...state, selected: nextId };
};

export const SELECT_PREV_ITEM = (state: SlashMenuState) => {
  const prevId = getPreviousItemId(state);
  if (!prevId) return state;
  return { ...state, selected: prevId };
};

export const OPEN_SLASH_MENU =
  (domRect: DOMRect) =>
  (state: SlashMenuState): SlashMenuState => ({
    ...state,
    open: true,
    domRect,
  });

export const CLOSE_SLASH_MENU =
  (event: KeyboardEvent) =>
  (state: SlashMenuState): SlashMenuState => {
    const { subMenuId } = state;

    if (subMenuId) {
      const submenu = getElementById(subMenuId, state.initialState) as SubMenu;
      const callback = submenu?.callbackOnClose;
      if (!submenu?.locked) {
        if (callback) {
          callback();
        }
        const meta = {
          type: SlashMetaTypes.closeSubMenu,
          element: getElementById(subMenuId, state.initialState),
        };
        return CLOSE_SUBMENU(state, meta);
      }
      return CLOSE_WHOLE_MENU(state);
    }
    if (event.key === "/") {
      return CLOSE_WHOLE_MENU(state);
    }
    return CLOSE_WHOLE_MENU(state);
  };

export const RESET_STATE = (state: SlashMenuState): SlashMenuState => {
  return {
    initialState: state.initialState,
    ...state.initialState,
  };
};

export const ADD_FILTER_CHARACTER =
  (char: string) =>
  (state: SlashMenuState): SlashMenuState => {
    const newFilter = state.filter.concat(char);
    const newElements = newFilter
      ? getFilteredItems(state, newFilter)
      : state.initialState.elements;
    const selectedId = newElements?.[0]?.id;
    return {
      ...state,
      selected: selectedId || state.selected,
      filteredElements: newElements,
      filter: newFilter || "",
    };
  };

export const REMOVE_LAST_FILTER_CHARACTER = (
  state: SlashMenuState
): SlashMenuState => {
  const newFilter = state.filter.length === 1 ? "" : state.filter.slice(0, -1);
  const newElements = newFilter
    ? getFilteredItems(state, newFilter)
    : state.initialState.elements;
  const selectedId = newElements?.[0]?.id;
  return {
    ...state,
    selected: selectedId || state.selected,
    filteredElements: newElements,
    filter: newFilter || "",
  };
};
