export class Overlay {
  private readonly root: HTMLDivElement;
  private readonly titleEl: HTMLHeadingElement;
  private readonly messageEl: HTMLParagraphElement;
  private readonly startButton: HTMLButtonElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement("div");
    this.root.className = "overlay";

    this.titleEl = document.createElement("h1");
    this.titleEl.className = "overlay__title";
    this.titleEl.textContent = "VibeGame";

    this.messageEl = document.createElement("p");
    this.messageEl.className = "overlay__message";
    this.messageEl.textContent = "Webcam cutout + fluid playground";

    this.startButton = document.createElement("button");
    this.startButton.className = "overlay__button";
    this.startButton.type = "button";
    this.startButton.textContent = "Start";

    this.root.append(this.titleEl, this.messageEl, this.startButton);
    parent.append(this.root);
  }

  onStart(handler: () => void): void {
    this.startButton.onclick = () => {
      handler();
    };
  }

  setReady(message = "Use your hands to push fluid"): void {
    this.messageEl.textContent = message;
    this.startButton.disabled = false;
    this.startButton.textContent = "Start";
    this.root.classList.remove("overlay--error");
    this.root.classList.remove("overlay--loading");
    this.show();
  }

  setLoading(message: string): void {
    this.messageEl.textContent = message;
    this.startButton.disabled = true;
    this.startButton.textContent = "Loading...";
    this.root.classList.remove("overlay--error");
    this.root.classList.add("overlay--loading");
    this.show();
  }

  setError(message: string): void {
    this.messageEl.textContent = message;
    this.startButton.disabled = false;
    this.startButton.textContent = "Try Again";
    this.root.classList.remove("overlay--loading");
    this.root.classList.add("overlay--error");
    this.show();
  }

  show(): void {
    this.root.hidden = false;
  }

  hide(): void {
    this.root.hidden = true;
  }
}
