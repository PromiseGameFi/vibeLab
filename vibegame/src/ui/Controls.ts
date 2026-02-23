import type { QualityMode } from "../types";

export interface ControlsCallbacks {
  onMirrorChange: (value: boolean) => void;
  onQualityChange: (value: QualityMode) => void;
  onReset: () => void;
  onDebugChange: (value: boolean) => void;
}

export class Controls {
  private readonly root: HTMLDivElement;
  private readonly mirrorInput: HTMLInputElement;
  private readonly qualitySelect: HTMLSelectElement;
  private readonly debugInput: HTMLInputElement;
  private readonly hud: HTMLDivElement;

  constructor(parent: HTMLElement, callbacks: ControlsCallbacks) {
    this.root = document.createElement("div");
    this.root.className = "controls";

    const mirrorRow = document.createElement("label");
    mirrorRow.className = "controls__row";
    mirrorRow.textContent = "Mirror";

    this.mirrorInput = document.createElement("input");
    this.mirrorInput.type = "checkbox";
    this.mirrorInput.checked = true;
    this.mirrorInput.addEventListener("change", () => {
      callbacks.onMirrorChange(this.mirrorInput.checked);
    });
    mirrorRow.append(this.mirrorInput);

    const qualityRow = document.createElement("label");
    qualityRow.className = "controls__row";
    qualityRow.textContent = "Quality";

    this.qualitySelect = document.createElement("select");
    const qualityOptions: QualityMode[] = ["auto", "low", "medium", "high"];
    for (const option of qualityOptions) {
      const optionEl = document.createElement("option");
      optionEl.value = option;
      optionEl.textContent = option;
      this.qualitySelect.append(optionEl);
    }
    this.qualitySelect.value = "auto";
    this.qualitySelect.addEventListener("change", () => {
      callbacks.onQualityChange(this.qualitySelect.value as QualityMode);
    });
    qualityRow.append(this.qualitySelect);

    const debugRow = document.createElement("label");
    debugRow.className = "controls__row";
    debugRow.textContent = "Debug HUD";

    this.debugInput = document.createElement("input");
    this.debugInput.type = "checkbox";
    this.debugInput.checked = false;
    this.debugInput.addEventListener("change", () => {
      callbacks.onDebugChange(this.debugInput.checked);
    });
    debugRow.append(this.debugInput);

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "controls__button";
    resetButton.textContent = "Reset Fluid";
    resetButton.addEventListener("click", () => {
      callbacks.onReset();
    });

    this.hud = document.createElement("div");
    this.hud.className = "hud";
    this.hud.hidden = true;

    this.root.append(mirrorRow, qualityRow, debugRow, resetButton, this.hud);
    parent.append(this.root);
  }

  setVisible(visible: boolean): void {
    this.root.hidden = !visible;
  }

  setQuality(value: QualityMode): void {
    this.qualitySelect.value = value;
  }

  updateHud(text: string, visible: boolean): void {
    this.hud.hidden = !visible;
    if (visible) {
      this.hud.textContent = text;
    }
  }
}
