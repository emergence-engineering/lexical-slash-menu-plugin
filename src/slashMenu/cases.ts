import {
  $getSelection,
  $isRangeSelection,
  $getRoot,
  $isParagraphNode,
  $isRootNode,
} from "lexical";

import { getElementById } from "./utils";
import { OpeningConditions, SlashMenuState } from "./types";

export enum SlashCases {
  OpenMenu = "openMenu",
  CloseMenu = "closeMenu",
  Execute = "Execute",
  NextItem = "NextItem",
  PrevItem = "PrevItem",
  inputChange = "InputChange",
  addChar = "addChar",
  removeChar = "removeChar",
  Ignore = "Ignore",
  Catch = "Catch",
}

const defaultConditions = (openInSelection = false): OpeningConditions => {
  return {
    shouldOpen: (state: SlashMenuState, event: KeyboardEvent) => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return false;
      }
      const to = selection.anchor.offset;
      const from = selection.focus.offset;
      const docSize = $getRoot().getTextContentSize();

      const node = selection.getNodes()?.[0];
      const textContent = node?.getTextContent() || "";
      const parentNode = node.getParent();
      const inParagraph = $isParagraphNode(parentNode);
      const inRoot = $isRootNode(parentNode);

      const pos = from < 0 || from > docSize ? null : from;
      const prevCharacter = pos ? textContent.slice(pos - 1, pos) : null;

      const spaceBeforePos =
        prevCharacter === " " || prevCharacter === "" || prevCharacter === " ";

      return (
        !state.open &&
        event.key === "/" &&
        (inParagraph || inRoot) &&
        (spaceBeforePos || inRoot || (from !== to && openInSelection))
      );
    },
    shouldClose: (state: SlashMenuState, event: KeyboardEvent) =>
      state.open &&
      (event.key === "/" ||
        event.key === "Escape" ||
        event.key === "Backspace") &&
      state.filter.length === 0,
  };
};

export const getCase = (
  state: SlashMenuState,
  event: KeyboardEvent,
  ignoredKeys: string[],
  customConditions?: OpeningConditions,
  shouldOpenInSelection?: boolean
): SlashCases => {
  const condition =
    customConditions || defaultConditions(shouldOpenInSelection);

  const selected = getElementById(state.selected, state);

  if (condition.shouldOpen(state, event)) {
    return SlashCases.OpenMenu;
  }
  if (condition.shouldClose(state, event)) {
    return SlashCases.CloseMenu;
  }
  if (state.open) {
    if (event.key === "ArrowDown") {
      return SlashCases.NextItem;
    }
    if (event.key === "ArrowUp") {
      return SlashCases.PrevItem;
    }
    if (
      event.key === "Enter" ||
      event.key === "Tab" ||
      (event.key === "ArrowRight" && selected?.type === "submenu")
    ) {
      return SlashCases.Execute;
    }
    if (
      event.key === "Escape" ||
      (event.key === "Backspace" && state.filter.length === 0) ||
      (event.key === "ArrowLeft" && state.subMenuId)
    ) {
      return SlashCases.CloseMenu;
    }
    if (state.filter.length > 0 && event.key === "Backspace") {
      return SlashCases.removeChar;
    }
    if (!ignoredKeys.includes(event.key)) {
      return SlashCases.addChar;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      return SlashCases.Catch;
    }
  }

  return SlashCases.Ignore;
};
