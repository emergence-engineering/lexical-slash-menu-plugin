import React, {
  FC,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { ComputePositionConfig } from "@floating-ui/react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { getElementById } from "./utils";
import { MenuElement, OpeningConditions, SlashMetaTypes } from "./types";
import { ListItem } from "./ListItem";
import { defaultIcons } from "./icons";
import { useFloating } from "./hooks/useFloating";
import { useRegisterKeydown } from "./hooks/useRegisterKeydown";

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
  floatingReference?: HTMLElement;
  floatingOptions?: Partial<ComputePositionConfig>;
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
  floatingReference,
  floatingOptions,
  clickable,
}: PropsWithChildren<SlashMenuProps>) {
  const [editor] = useLexicalComposerContext();

  const { slashMenuState, rect, handleClick, handleClose, setSelectedItemId } =
    useRegisterKeydown(
      editor,
      menuElements,
      ignoredKeys,
      customConditions,
      openInSelection
    );

  useFloating(rect as Element, floatingReference, floatingOptions);

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

  const subMenuLabel = useMemo(() => {
    if (slashMenuState?.subMenuId) {
      return getElementById(slashMenuState.subMenuId, slashMenuState)?.label;
    }

    return null;
  }, [slashMenuState]);

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

      <div id="slashDisplay" className="menu-display-root">
        {slashMenuState.subMenuId ? (
          <div
            className="menu-element-wrapper"
            onClick={clickable ? handleClose : undefined}
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
            setSelectedItemId={setSelectedItemId}
            handleClick={handleClick}
            key={el.id}
            menuState={slashMenuState}
            Icon={icons?.[el.id]}
            RightIcon={rightIcons?.[el.id]}
            idx={idx}
            clickable={clickable}
            el={el}
          />
        ))}
        {elements?.length === 0 ? (
          <div className="menu-placeholder">No matching items</div>
        ) : null}
      </div>
    </div>
  );
}
