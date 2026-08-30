class ToastStore {
  message = $state('');
  visible = $state(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  show(msg: string) {
    this.message = msg;
    this.visible = true;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => (this.visible = false), 2200);
  }
}

export const toast = new ToastStore();
