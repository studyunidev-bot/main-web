"use client";

import Quill from "quill";

type ImageBlot = {
  new (...args: unknown[]): {
    domNode: HTMLElement;
    format(name: string, value: unknown): void;
  };
  blotName: string;
  tagName: string;
  create(value: string): HTMLElement;
  formats(domNode: HTMLElement): Record<string, string>;
  format(this: { domNode: HTMLElement }, name: string, value: unknown): void;
};

const Image = Quill.import("formats/image") as ImageBlot;

class CaptionImage extends Image {
  static blotName = "image";
  static tagName = "IMG";

  static formats(domNode: HTMLElement) {
    const formats = super.formats(domNode);
    if (domNode.hasAttribute("data-caption")) {
      formats["data-caption"] = domNode.getAttribute("data-caption") || "";
    }
    return formats;
  }

  format(name: string, value: unknown) {
    if (name === "data-caption") {
      if (value) this.domNode.setAttribute("data-caption", String(value));
      else this.domNode.removeAttribute("data-caption");
      return;
    }
    super.format(name, value);
  }
}

let registered = false;

export function registerCaptionImageBlot() {
  if (registered || typeof window === "undefined") return;
  Quill.register("formats/image", CaptionImage, true);
  registered = true;
}
