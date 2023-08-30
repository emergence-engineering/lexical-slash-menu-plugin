import { useCallback, useEffect, useState } from "react";
import {
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  KEY_DOWN_COMMAND,
  LexicalEditor,
} from "lexical";

import { getCase, SlashCases } from "../cases";
import {
  MenuElement,
  OpeningConditions,
  SlashMenuState,
  SlashMetaTypes,
} from "../types";
import { defaultIgnoredKeys, getDOMRangeRect, getElementById } from "../utils";
import {
  ADD_FILTER_CHARACTER,
  OPEN_SUB_MENU,
  REMOVE_LAST_FILTER_CHARACTER,
  SELECT_NEXT_ITEM,
  SELECT_PREV_ITEM,
  SET_SELECTED_ITEM_ID,
  CLOSE_SLASH_MENU,
  OPEN_SLASH_MENU,
  RESET_STATE,
} from "../state";

const bootStrapInitialState = (
  menuElements: MenuElement[],
  ignoredKeys?: string[]
) => ({
  selected: menuElements[0].id,
  open: false,
  filter: "",
  ignoredKeys: ignoredKeys
    ? [...defaultIgnoredKeys, ...ignoredKeys]
    : defaultIgnoredKeys,
  filteredElements: menuElements.filter((element) => !element.locked),
  elements: menuElements,
  domRect: undefined,
});

export const useRegisterKeydown = (
  editor: LexicalEditor,
  menuElements: MenuElement[],
  ignoredKeys?: string[],
  customConditions?: OpeningConditions,
  openInSelection?: boolean
) => {
  const [slashMenuState, setSlashMenuState] = useState<SlashMenuState>(
    (): SlashMenuState => {
      const state = bootStrapInitialState(menuElements, ignoredKeys);
      return {
        initialState: state,
        ...state,
      };
    }
  );

  const [rect, setRect] = useState<Element | null | undefined>(undefined);

  console.log("STATE", slashMenuState);

  useEffect(() => {
    if (!editor) return () => undefined;
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (keyboardEvent, editor) => {
        const slashCase = getCase(
          slashMenuState,
          keyboardEvent,
          defaultIgnoredKeys,
          customConditions,
          openInSelection
        );
        console.log("CASE", slashCase);
        switch (slashCase) {
          case SlashCases.OpenMenu: {
            keyboardEvent.preventDefault();
            const selection = $getSelection();
            const nodes = selection?.getNodes();
            const currentNode = nodes?.[0];
            if (!currentNode) {
              return false;
            }
            const currentNodeDOMElement = editor.getElementByKey(
              currentNode.getKey()
            );

            const clientRect = $isParagraphNode(currentNode)
              ? currentNodeDOMElement?.children[0]?.getBoundingClientRect()
              : currentNodeDOMElement?.getBoundingClientRect();

            setRect(() => {
              const domEl = $isParagraphNode(currentNode)
                ? currentNodeDOMElement?.children?.[0]
                : currentNodeDOMElement;

              if (!domEl || !$isRangeSelection(selection)) {
                return undefined;
              }

              const rootElement = editor.getRootElement();
              const rangeRect = getDOMRangeRect(
                window.getSelection() as Selection,
                rootElement as HTMLElement
              );

              const { bottom, height, left, right, top, width, x, y } =
                rangeRect;

              if (rangeRect.width === 0 && rangeRect.height === 0) {
                return domEl;
              }

              return {
                getBoundingClientRect() {
                  return {
                    bottom,
                    height,
                    left,
                    right,
                    top,
                    width,
                    x,
                    y,
                  };
                },
              } as Element;
            });

            if (clientRect) {
              setSlashMenuState(OPEN_SLASH_MENU(clientRect));
            }
            return true;
          }
          case SlashCases.CloseMenu:
            keyboardEvent.preventDefault();
            setSlashMenuState(CLOSE_SLASH_MENU(keyboardEvent));
            return true;
          case SlashCases.Execute: {
            keyboardEvent.preventDefault();
            const menuElement = getElementById(
              slashMenuState.selected,
              slashMenuState
            );
            if (!menuElement) {
              return false;
            }
            if (menuElement.type === "command") {
              setSlashMenuState(RESET_STATE);
              menuElement.command(editor);
            }
            if (menuElement.type === "submenu") {
              const meta = {
                type: SlashMetaTypes.openSubMenu,
                element: menuElement,
              };
              setSlashMenuState(OPEN_SUB_MENU(meta));
            }
            return true;
          }
          case SlashCases.NextItem: {
            keyboardEvent.preventDefault();
            setSlashMenuState(SELECT_NEXT_ITEM);
            return true;
          }
          case SlashCases.PrevItem: {
            keyboardEvent.preventDefault();
            setSlashMenuState(SELECT_PREV_ITEM);
            return true;
          }
          case SlashCases.addChar: {
            keyboardEvent.preventDefault();
            setSlashMenuState(ADD_FILTER_CHARACTER(keyboardEvent.key));
            return true;
          }
          case SlashCases.removeChar: {
            keyboardEvent.preventDefault();
            setSlashMenuState(REMOVE_LAST_FILTER_CHARACTER);
            return true;
          }
          case SlashCases.Catch:
            return true;
          default:
            return false;
        }
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, slashMenuState]);

  const handleClick = useCallback(
    (id: string) => {
      const menuElement = getElementById(id, slashMenuState);
      if (!menuElement) {
        return;
      }

      if (menuElement.type === "command") {
        setSlashMenuState(RESET_STATE);
        menuElement.command(editor);
      }

      if (menuElement.type === "submenu") {
        const meta = {
          type: SlashMetaTypes.openSubMenu,
          element: menuElement,
        };
        setSlashMenuState(OPEN_SUB_MENU(meta));
      }
    },
    [editor, slashMenuState]
  );

  const handleClose = useCallback(() => {
    setSlashMenuState(CLOSE_SLASH_MENU());
  }, [editor, slashMenuState]);

  const setSelectedItemId = useCallback(
    (id: string) => {
      setSlashMenuState(SET_SELECTED_ITEM_ID(id));
    },
    [editor, slashMenuState]
  );

  return { slashMenuState, rect, handleClick, handleClose, setSelectedItemId };
};
