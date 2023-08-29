import {
  computePosition,
  ComputePositionConfig,
  flip,
  offset,
  shift,
} from "@floating-ui/react-dom";
import { useEffect } from "react";

export const useFloating = (
  rect?: Element | null | undefined,
  floatingReference?: HTMLElement,
  floatingOptions?: Partial<ComputePositionConfig>
) => {
  const floating = document.getElementById("floating") as HTMLElement;

  useEffect(() => {
    if (!rect && !floatingReference) {
      return;
    }
    const reference = (floatingReference as Element) || rect;

    computePosition(reference, floating, {
      ...(floatingOptions || {
        placement: "right-start",
        middleware: [offset(5), flip(), shift()],
      }),
    }).then(({ x, y }) => {
      Object.assign(floating.style, {
        top: `${y + 20}px`,
        left: `${x}px`,
      });
    });
  }, [rect, floatingReference, floatingOptions]);
};
