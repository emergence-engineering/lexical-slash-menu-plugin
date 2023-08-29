# lexical-link-preview-react

![made by Emergence Engineering](https://emergence-engineering.com/ee-logo.svg)

[**Made by Emergence-Engineering**](https://emergence-engineering.com/)

## Basic usage

- import `SlashMenuPlugin` from `lexical-slash-menu-plugin`
- import `styles.css` file
- create your `menuElements` array with commands and with even submenus

```ts
import { SlashMenuPlugin } from "lexical-slash-menu-plugin";
import "lexical-slash-menu-plugin/dist/styles/style.css";

import {
  $createTextNode,
  $getSelection,
  $isParagraphNode,
  LexicalEditor,
} from "lexical";

const insertText = (text: string) => {
  const selection = $getSelection();
  const nodes = selection?.getNodes();
  const paragraphNode = $isParagraphNode(nodes?.[0])
    ? nodes?.[0]
    : nodes?.[0]?.getParent();
  const textNode = $createTextNode(text);
  if (paragraphNode) {
    paragraphNode.append(textNode);
  }
};

<SlashMenuPlugin
  menuElements={[
    {
      id: "1",
      label: "First",
      type: "command",
      command: (editor: LexicalEditor) => {
        editor.update(() => {
          insertText("First");
        });
      },
    },
    {
      id: "2",
      label: "Second",
      type: "command",
      command: (editor: LexicalEditor) => {
        editor.update(() => {
          insertText("Second");
        });
      },
    },
    {
      id: "3",
      label: "Submenu",
      type: "submenu",
      elements: [
        {
          id: "4",
          label: "Third",
          type: "command",
          command: (editor: LexicalEditor) => {
            editor.update(() => {
              insertText("Third");
            });
          },
        },
        {
          id: "5",
          label: "Fourth",
          type: "command",
          command: (editor: LexicalEditor) => {
            editor.update(() => {
              insertText("Fourth");
            });
          },
        },
      ],
    },
  ]}
/>;
```

### Props

```ts
export function SlashMenuPlugins(
  menuElements: MenuElement[],
  ignoredKeys?: string[],
  customConditions?: OpeningConditions,
  openInSelection?: boolean,
  icons?: {
    [key: string]: FC;
  },
  rightIcons?: {
    [key: string]: FC;
  },
  subMenuIcon?: ReactNode;
  filterFieldIcon?: ReactNode;
  filterPlaceHolder?: string;
  mainMenuLabel?: string;
  floatingReference?: HTMLElement;
  floatingOptions?: Partial<ComputePositionConfig>;
  clickable?: boolean;
)
```

### Flexible positioning

the plugin uses [`floating-ui`](https://floating-ui.com/) for positioning the menu element

- `floatingReference?: HTMLElement` for custom menu element positioning
- `floatingOptions?: Partial<ComputePositionConfig>`for overriding our `floating-ui` options

### Overriding `customConditions`

opening conditions tell when the menu element can be triggered to be opened

- `defaultConditions`

```ts
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
```

### Styles

you have full controll over our css classes

- check `src/styles/style.css` for default styles
- check `src/slashMenu/SlashMenuPlugin.tsx` and `src/slashMenu/ListItem.tsx` for dom structure

### Types

```ts
export type MenuElement = CommandItem | SubMenu;

export type ItemId = string | "root";
export type ItemType = "command" | "submenu";
export interface CommandItem extends MenuItem {
  type: "command";
  command: (editor: LexicalEditor) => void;
}

export interface SubMenu extends MenuItem {
  type: "submenu";
  elements: MenuElement[];
  callbackOnClose?: () => void;
}

export interface OpeningConditions {
  shouldOpen: (state: SlashMenuState, event: KeyboardEvent) => boolean;
  shouldClose: (state: SlashMenuState, event: KeyboardEvent) => boolean;
}
```
