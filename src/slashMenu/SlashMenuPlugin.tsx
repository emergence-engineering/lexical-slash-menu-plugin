import React, {
  FC,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { computePosition, flip, offset, shift } from "@floating-ui/react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isParagraphNode,
  COMMAND_PRIORITY_CRITICAL,
  KEY_DOWN_COMMAND,
} from "lexical";

import { defaultIgnoredKeys, getElementById } from "./utils";
import {
  MenuElement,
  OpeningConditions,
  SlashMenuState,
  SlashMetaTypes,
} from "./types";
import { getCase, SlashCases } from "./cases";
import { ListItem } from "./ListItem";
import {
  ADD_FILTER_CHARACTER,
  CLOSE_SLASH_MENU,
  OPEN_SLASH_MENU,
  OPEN_SUB_MENU,
  REMOVE_LAST_FILTER_CHARACTER,
  RESET_STATE,
  SELECT_NEXT_ITEM,
  SELECT_PREV_ITEM,
} from "./state";
import { defaultIcons } from "./icons";

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

interface SlashMenuViewProps {
  icons?: {
    [key: string]: FC;
  };
  rightIcons?: {
    [key: string]: FC;
  };
  subMenuIcon?: ReactNode;
  filterFieldIcon?: ReactNode;
  filterPlaceHolder?: string;
  mainMenuLabel?: string;
  popperReference?: HTMLElement;
  clickable?: boolean;
}

interface SlashMenuStateProps {
  menuElements: MenuElement[];
  ignoredKeys?: string[];
  customConditions?: OpeningConditions;
  openInSelection?: boolean;
}

interface SlashMenuProps extends SlashMenuViewProps, SlashMenuStateProps {}

export interface SlashMenuAction {
  type: SlashMetaTypes;
}

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

export function SlashMenuPlugin({
  menuElements,
  ignoredKeys,
  customConditions,
  openInSelection,
  icons,
  rightIcons,
  subMenuIcon,
  filterFieldIcon,
  filterPlaceHolder,
  mainMenuLabel,
  popperReference,
  // popperOptions,
  clickable,
}: PropsWithChildren<SlashMenuProps>) {
  const [editor] = useLexicalComposerContext();

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

  useEffect(() => {
    if (!editor) return () => undefined;
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (keyboardEvent, editor) => {
        const slashCase = getCase(
          slashMenuState,
          keyboardEvent,
          defaultIgnoredKeys
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

  console.log("STATE", slashMenuState);

  const elements = useMemo(() => {
    if (!slashMenuState) {
      return null;
    }

    return slashMenuState.filteredElements;
  }, [slashMenuState]);

  const closeSubMenu = useCallback(() => {
    // if (menuState?.subMenuId) {
    //   dispatchWithMeta(editorView, SlashMenuKey, {
    //     type: SlashMetaTypes.closeSubMenu,
    //     element: getElementById(menuState.subMenuId, menuState),
    //   });
    // }
  }, [slashMenuState]);

  const rootRef = useRef<HTMLDivElement>(null);

  const subMenuLabel = useMemo(() => {
    if (slashMenuState?.subMenuId) {
      return getElementById(slashMenuState.subMenuId, slashMenuState)?.label;
    }

    return null;
  }, [slashMenuState]);

  useEffect(() => {
    if (!rect) {
      return;
    }
    const floating = document.getElementById("floating") as HTMLElement;

    computePosition(rect, floating, {
      placement: "right-start",
      middleware: [offset(5), flip(), shift()],
    }).then(({ x, y }) => {
      Object.assign(floating.style, {
        top: `${y + 20}px`,
        left: `${x}px`,
      });
    });
  }, [rect]);

  return (
    <div
      id="floating"
      style={{
        display: slashMenuState.open ? "block" : "none",
        position: "absolute",
        width: "200px",
        height: "150px",
      }}
    >
      {slashMenuState.open &&
      slashMenuState.domRect &&
      slashMenuState.filter ? (
        <div className="menu-filter-wrapper">
          {filterFieldIcon ? (
            <div className="menu-filter-icon">{filterFieldIcon}</div>
          ) : null}
          <div id="menu-filter" className="menu-filter">
            {slashMenuState.filter}
          </div>
        </div>
      ) : (
        <div className="menu-filter-wrapper">
          {filterFieldIcon ? (
            <div className="menu-filter-icon">{filterFieldIcon}</div>
          ) : null}
          <div className="menu-filter-placeholder">{filterPlaceHolder}</div>
        </div>
      )}

      <div id="slashDisplay" ref={rootRef} className="menu-display-root">
        {slashMenuState.subMenuId ? (
          <div
            className="menu-element-wrapper"
            onClick={clickable ? closeSubMenu : undefined}
            style={{ cursor: clickable ? "pointer" : undefined }}
            role="presentation"
          >
            <div className="menu-element-icon-left">
              {subMenuIcon || defaultIcons.ArrowLeft()}
            </div>
            <div className="submenu-label">{subMenuLabel}</div>
          </div>
        ) : null}
        {!slashMenuState.subMenuId && mainMenuLabel ? (
          <div className="menu-element-wrapper">
            <div className="submenu-label">{mainMenuLabel}</div>
          </div>
        ) : null}
        {elements?.map((el, idx) => (
          <ListItem
            key={el.id}
            menuState={slashMenuState}
            Icon={icons?.[el.id]}
            RightIcon={rightIcons?.[el.id]}
            idx={idx}
            clickable={clickable}
            el={el}
            // view={editorView}
          />
        ))}
        {elements?.length === 0 ? (
          <div className="menu-placeholder">No matching items</div>
        ) : null}
      </div>
    </div>
  );
}
