import React, { FC, useEffect } from "react";

import { MenuElement, SlashMenuState } from "./types";

export const ListItem: FC<{
  menuState: SlashMenuState;
  el: MenuElement;
  idx: number;
  Icon?: FC;
  RightIcon?: FC;
  clickable?: boolean;
}> = ({ menuState, el, Icon, idx, clickable, RightIcon }) => {
  useEffect(() => {
    const element = document.getElementById(el.id);
    if (!element) return;
    if (el.id === menuState.selected) {
      element.classList.add("menu-element-selected");
      return;
    }
    if (element.classList.contains("menu-element-selected")) {
      element.classList.remove("menu-element-selected");
    }
  }, [menuState.selected]);

  return (
    <div
      className={
        clickable ? "menu-element-wrapper-clickable" : "menu-element-wrapper"
      }
      id={el.id}
      key={`${el.id}-${idx}`}
    >
      {Icon ? (
        <div className="menu-element-icon">
          <Icon />
        </div>
      ) : null}
      <div className="menu-element-label">{el.label}</div>
      {RightIcon ? (
        <div className="menu-element-right-icon">
          <RightIcon />
        </div>
      ) : null}
    </div>
  );
};
