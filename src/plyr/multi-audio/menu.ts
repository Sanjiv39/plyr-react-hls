import Hls from "hls.js";
import Plyr from "plyr";
import { AudioItem } from "./menu-item";

export type ExtendedPlyr = Plyr &
  Partial<{
    id: number;
    elements: Plyr["elements"] &
      Partial<{
        settings: {
          buttons?: {
            [k: string]: HTMLButtonElement | undefined;
          };
          panels?: {
            [k: string]: HTMLDivElement | undefined;
          };
        };
      }>;
  }>;

export class AudioSettings {
  plyr: ExtendedPlyr | null = null;
  hls: Hls | null = null;
  settingsMenu: HTMLDivElement | null = null;
  menuWrapper: HTMLDivElement | null = null;
  menuTitle: HTMLSpanElement | null = null;
  menu: HTMLDivElement | null = null;
  homeMenuOption: HTMLButtonElement | null = null;
  items: AudioItem[] = [];

  validateParams(
    plyr: typeof this.plyr = this.plyr,
    hls: typeof this.hls = this.hls
  ) {
    if (!plyr || !(plyr instanceof Plyr)) {
      throw new Error("Plyr invalid");
    }
    if (!hls || !(hls instanceof Hls)) {
      throw new Error("Hls invalid");
    }
    if (typeof plyr?.id !== "number" || !Number.isFinite(plyr?.id)) {
      throw new Error("Plyr has no valid id");
    }
    return plyr instanceof Plyr && hls instanceof Hls;
  }

  addMenuToHome = () => {
    const homeMenu = document.querySelector(
      `div#plyr-settings-${this.plyr?.id}-home > div[role="menu"]`
    ) as HTMLDivElement | null;
    const homeWrapper = homeMenu?.parentElement as HTMLDivElement;
    if (!homeMenu || !homeWrapper) {
      return;
    }

    const idClass = `plyr__settings-home__audios-menu__${this.plyr?.id}`;
    const existing = document.querySelector(`.${idClass}`);
    existing && homeMenu?.removeChild(existing);

    // Create menu button
    const btn = document.createElement("button");
    btn.type = "button";
    btn.classList.add("plyr__control", "plyr__control--forward", idClass);
    btn.setAttribute("data-plyr", "settings");
    btn.role = "menuitem";
    btn.ariaHasPopup = "true";
    // title
    const btnTitle = document.createElement("span");
    btnTitle.textContent = "Audio";
    // value
    const btnValue = document.createElement("span");
    btnValue.classList.add("plyr__menu__value");
    btnValue.innerText = "Default";

    btnTitle.appendChild(btnValue);
    btn.appendChild(btnTitle);
    btn.addEventListener("click", (ev) => {
      homeWrapper.hidden = true;
      if (this.menuWrapper) {
        this.menuWrapper.hidden = false;
      }
    });

    homeMenu?.appendChild(btn);
    // Append in config
    if (this.plyr?.elements?.settings) {
      this.plyr.elements.settings.buttons = {
        ...this.plyr.elements.settings.buttons,
        audios: btn,
      };
    }

    // Expose
    this.homeMenuOption = btn;
  };

  createMenu = () => {
    const id = `plyr-settings-${this.plyr?.id}-audios`;

    // Clean existing audio menu
    const existing = document.querySelector(id);
    existing && this.settingsMenu?.removeChild(existing);

    // Menu Wrapper
    const menuWrapper = document.createElement("div");
    menuWrapper.id = id;
    menuWrapper.hidden = true;

    // Menu Button
    const menuBtn = document.createElement("button");
    menuBtn.type = "button";
    menuBtn.classList.add("plyr__control", "plyr__control--back");
    // title
    const menuTitle = document.createElement("span");
    menuTitle.ariaHidden = "true";
    menuTitle.innerText = "Audio";
    // tagline (helper)
    const menuTagline = document.createElement("span");
    menuTagline.classList.add("plyr__sr-only");
    menuTagline.innerText = "Change Audio track";
    menuBtn.appendChild(menuTitle);
    menuBtn.appendChild(menuTagline);
    menuBtn.addEventListener("click", (ev) => {
      const isHidden = menuWrapper.hidden;
      menuWrapper.hidden = !isHidden;
      Array.from(this.settingsMenu?.children || []).map(
        // @ts-ignore
        (el: HTMLDivElement) => {
          if (el.id === `plyr-settings-${this.plyr?.id}-home`) {
            el.hidden = isHidden;
          }
        }
      );
    });

    // Menu
    const menu = document.createElement("div");
    menu.role = "menu";

    // Insert audios
    const audioTracks = this.hls?.audioTracks || [];
    for (let i = 0; i < audioTracks.length; i++) {
      const track = audioTracks[i];
      const selected = this.hls?.audioTrack === i;
      const item = new AudioItem(this.hls as Hls, track, {
        enable: !!selected,
        onSelect: (id, name, data) => {
          const valueEl = this.homeMenuOption?.querySelector(
            "span.plyr__menu__value"
          ) as HTMLSpanElement;
          if (valueEl) {
            valueEl.innerText = name;
          }
          const elements = [...(menu?.childNodes || [])] as HTMLButtonElement[];
          this.hls?.setAudioOption(data);
          elements.forEach((el) => {
            if (
              el.tagName.toLowerCase() === "button" &&
              el.classList.contains("plyr__control") &&
              el.hasAttribute("aria-checked") &&
              el.value !== id.toString()
            ) {
              el.ariaChecked = "false";
            }
          });
          Array.from(this.settingsMenu?.children || []).map(
            // @ts-ignore
            (el: HTMLDivElement) => {
              if (el.id === `plyr-settings-${this.plyr?.id}-home`) {
                el.hidden = false;
                return;
              }
              el.hidden = true;
            }
          );
        },
      });
      menu.appendChild(item.element as HTMLButtonElement);
      this.items.push(item);
    }

    menuWrapper.appendChild(menuBtn);
    menuWrapper.appendChild(menu);
    this.settingsMenu?.appendChild(menuWrapper);
    // Append to config
    if (this.plyr?.elements?.settings) {
      this.plyr.elements.settings.panels = {
        ...this.plyr.elements.settings.panels,
        audios: menuWrapper,
      };
    }

    // Expose
    this.menuTitle = menuTitle;
    this.menuWrapper = menuWrapper;
    this.menu = menu;

    const observer = new ResizeObserver(() => {
      console.log("Audio menu height :", menuWrapper.scrollHeight);
      console.log(
        "Other menu height :",
        menuWrapper.parentElement?.children[0]?.scrollHeight
      );
    });
    observer.observe(menuWrapper);

    this.addMenuToHome();
  };

  constructor(plyr: ExtendedPlyr, hls: Hls) {
    this.validateParams(plyr, hls);
    this.plyr = plyr;
    this.hls = hls;

    const settingsMenu = document.querySelector(
      "div.plyr__controls__item.plyr__menu > div.plyr__menu__container > div"
    );
    console.log(settingsMenu);
    if (settingsMenu) {
      this.settingsMenu = settingsMenu as HTMLDivElement;
      this.createMenu();

      plyr.on("ready", () => {
        const selected = Number.isFinite(this.hls?.audioTrack)
          ? (this.hls?.audioTrack as number)
          : -1;
        const valueEl = this.homeMenuOption?.querySelector(
          "span.plyr__menu__value"
        ) as HTMLSpanElement;
        if (selected >= 0 && valueEl) {
          valueEl.innerText = this.items[selected]?.name || valueEl.innerText;
          this.items.forEach((item, i) => {
            if (item.element) {
              if (i === selected) {
                item.element.ariaChecked = "true";
                return;
              }
              item.element.ariaChecked = "false";
            }
          });
        }
      });
    }
  }
}
