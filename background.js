// ============================================================================================================
// Go to the tab that opened the current tab with context menu option.
//    - made by nomadic on the Vivaldi Forums
// ============================================================================================================

// Determines if the parent tab is still valid and switches to it or creates a new tab with the valid url
function goToParent() {
  // get the active tab
  chrome.tabs.query({ currentWindow: true, active: true }, (tab) => {
    tab = tab[0];
    let parentTabId = tab.openerTabId;
    let tabId = tab.id;

    // see what the tab's parent tab url is supposed to be
    chrome.storage.local.get(tabId.toString(), (storageItems) => {
      let savedUrl = storageItems[tabId.toString()];

      // if the parent tab still exists ...
      if (parentTabId) {
        // ... check the current url of the parent tab
        chrome.tabs.get(parentTabId, (parentTab) => {
          let parentTabUrl = parentTab.url ? parentTab.url : parentTab.pendingUrl ? parentTab.pendingUrl : null;

          if (parentTabUrl === savedUrl) {
            // if the parent tab has the same url as it did in the past, switch to the parent tab
            chrome.tabs.update(parentTabId, { highlighted: true });
          } else if (savedUrl && savedUrl !== "") {
            // create a new tab since the parent tab no longer has the correct url
            chrome.tabs.create({ url: savedUrl });
          }
        });
      } else if (savedUrl && savedUrl !== "") {
        // the parent tab no longer exists, so create a new tab with the saved url
        chrome.tabs.create({ url: savedUrl });
      }
    });
  });
}

// save a given tab's parent url to local storage
function saveParentUrl(tab) {
  let tabId = tab.id;
  let storageOBJ = {};
  if (tab.openerTabId) {
    chrome.tabs.get(tab.openerTabId, (parentTab) => {
      let url = parentTab.url ? parentTab.url : parentTab.pendingUrl ? parentTab.pendingUrl : "";
      storageOBJ[tabId.toString()] = url;
      chrome.storage.local.set(storageOBJ, function () {
        enableDisableContextMenu(tabId);
      });
    });
  } else {
    storageOBJ[tabId.toString()] = "";
    chrome.storage.local.set(storageOBJ, function () {
      enableDisableContextMenu(tabId);
    });
  }
}

function enableDisableContextMenu(tabId) {
  chrome.storage.local.get(tabId.toString(), (storageItems) => {
    let savedUrl = storageItems[tabId.toString()];
    if (!savedUrl || savedUrl === "") {
      chrome.contextMenus.update("parent-tab", { enabled: false });
    } else {
      chrome.contextMenus.update("parent-tab", { enabled: true });
    }
  });
}

// listener for clicks on context menu item
chrome.contextMenus.onClicked.addListener((info) => {
  // Match id used in context menu item creation
  if (info.menuItemId === "parent-tab") {
    goToParent();
  }
});

// whenever a new tab is created, add its parent tab's url to storage
chrome.tabs.onCreated.addListener(saveParentUrl);

// remove storage values when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(tabId.toString());
});

// enable/disable the context menu item as applicable
chrome.tabs.onActivated.addListener((activeInfo) => {
  let tabId = activeInfo.tabId;
  enableDisableContextMenu(tabId);
});

// Keyboard shortcut listner
chrome.commands.onCommand.addListener(function (command) {
  if (command === "go-to-parent-tab") {
    goToParent();
  }
});

// add the conext menu option at install time
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "parent-tab",
    title: "&Go to parent tab",
    contexts: ["all"],
    enabled: false,
  });
});
