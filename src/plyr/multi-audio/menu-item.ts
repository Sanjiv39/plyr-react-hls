import Hls, { MediaPlaylist } from "hls.js";
import { ExtendedPlyr } from "./menu";

type Options = {
  enable: Boolean;
  onSelect: (id: number, name: string, data: MediaPlaylist) => any;
  index: number;
};

export class AudioItem {
  trackData: Hls["audioTracks"][0] | null = null;
  element: HTMLButtonElement | null = null;
  textEl: HTMLSpanElement | null = null;
  badgeEl: HTMLSpanElement | null = null;
  name: string = "";
  options: Partial<Options> = {};

  validateParams(data = this.trackData, options = this.options) {
    if (typeof data !== "object" || !data || Array.isArray(data)) {
      throw new Error("Track data invalid");
    }
    if (typeof options !== "object" || !options || Array.isArray(data)) {
      throw new Error("Options invalid");
    }
  }

  createElement() {
    if (!this.trackData) {
      return;
    }

    this.name =
      this.trackData.name ||
      this.trackData.lang ||
      String(Math.max(this.options.index || 0, 0) || "Unknown");

    // Button
    const btn = document.createElement("button");
    btn.classList.add("plyr__control");
    btn.type = "button";
    btn.role = "menuitemradio";
    btn.ariaChecked = "false";
    btn.value = this.trackData.id.toString();
    // text
    const textEl = document.createElement("span");
    textEl.textContent = this.name;
    // badge
    const badgeEl = document.createElement("span");
    badgeEl.classList.add("plyr__menu__value");
    if (this.trackData.lang?.trim()) {
      badgeEl.innerHTML = `<span class="plyr__badge">${this.trackData.lang.trim()}</span>`;
    }

    textEl.appendChild(badgeEl);
    btn.appendChild(textEl);
    btn.addEventListener("click", (ev) => {
      btn.ariaChecked = "true";
      this.options.onSelect?.(
        this.trackData?.id as number,
        this.name,
        this.trackData as MediaPlaylist
      );
    });

    // Expose
    this.badgeEl = badgeEl;
    this.textEl = textEl;
    this.element = btn;
  }

  constructor(
    hls: Hls,
    data: typeof this.trackData,
    options?: Partial<Options>
  ) {
    this.validateParams(data, { ...options });
    this.trackData = data;
    this.options = { ...options };

    this.createElement();
    if (this.options.enable && this.element) {
      this.element.ariaChecked = "true";
    }
  }
}
