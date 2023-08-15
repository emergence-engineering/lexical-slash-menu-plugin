import { DecoratorNode, LexicalNode, NodeKey } from "lexical";
import { ReactNode } from "react";

function SlashMenuComponent() {
  return (
    <div>
      <h1>LOL ASD ASD</h1>
    </div>
  );
}

export class SlashMenuNode extends DecoratorNode<ReactNode> {
  __id: string;

  static getType(): string {
    return "slash-menu";
  }

  static clone(node: SlashMenuNode): SlashMenuNode {
    return new SlashMenuNode(node.__id, node.__key);
  }

  constructor(id: string, key?: NodeKey) {
    super(key);
    this.__id = id;
  }

  createDOM(): HTMLElement {
    return document.createElement("div");
  }

  updateDOM(): false {
    return false;
  }

  decorate(): ReactNode {
    return <SlashMenuComponent />;
  }
}

export function $createSlashMenuNode(id: string): SlashMenuNode {
  return new SlashMenuNode(id);
}

export function $isSlashMenuNode(
  node: LexicalNode | null | undefined,
): node is SlashMenuNode {
  return node instanceof SlashMenuNode;
}
