export interface HistoryEventInit extends EventInit {
  state: any;
}

export interface HistoryNavigation {
  key: string;
  index: number;
}

export class HistoryEvent extends Event {
  readonly state: any;

  constructor(type: string, options: HistoryEventInit) {
    const { state, ...eventInit } = options;
    super(type);
    this.state = state;
  }
}

const nativePushState = History.prototype.pushState;
const nativeReplaceState = History.prototype.replaceState;

function createKey() {
  return Math.random().toString(36).substring(2, 10);
}

const key = "navigation";
let index = history.state?.navigation?.index ?? -1;

if (index < 0) {
  index = 0;
  nativeReplaceState.call(
    history,
    Object.assign({}, history.state, {
      [key]: {
        key: createKey(),
        index,
      },
    }),
    "",
    location.pathname + location.search + location.hash
  );
}

History.prototype.pushState = function (
  data: any,
  unused: string,
  url?: string | URL | null | undefined
) {
  const state = Object.assign({}, data, {
    [key]: {
      key: createKey(),
      index: ++index,
    },
  });
  const pushStateEvent = new HistoryEvent("pushstate", { state });
  window.dispatchEvent(pushStateEvent);
  nativePushState.call(this, state, unused, url);
};

History.prototype.replaceState = function (
  data: any,
  unused: string,
  url?: string | URL | null | undefined
) {
  const state = Object.assign({}, data, {
    [key]: {
      key: createKey(),
      index: history.state?.navigation?.index ?? -1,
    },
  });
  const replaceStateEvent = new HistoryEvent("replacestate", { state });
  window.dispatchEvent(replaceStateEvent);
  nativeReplaceState.call(this, state, unused, url);
};

window.addEventListener("popstate", function (event) {
  index = event.state?.navigation?.index ?? -1;
});
