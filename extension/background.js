/** Opens Bee's side panel from the toolbar and from the right-click menu. */

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "piece",
      title: "Ask Bee about this piece",
      contexts: ["image", "link", "selection", "page"],
    });
    chrome.contextMenus.create({
      id: "occasion",
      title: "Ask Bee what to wear to this",
      contexts: ["selection"],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  // Open first, inside the click's user gesture; the panel picks the question up from storage.
  chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
  chrome.storage.session.set({
    pendingAsk: {
      kind: info.menuItemId === "occasion" ? "occasion" : "piece",
      text: (info.selectionText ?? "").slice(0, 600),
      image: info.srcUrl ?? null,
      link: info.linkUrl ?? null,
      pageUrl: info.pageUrl ?? tab.url ?? "",
      title: (tab.title ?? "").slice(0, 200),
      at: Date.now(),
    },
  });
});
