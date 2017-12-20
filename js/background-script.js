
var DomainMap = new Map();
var TabIdToDomain = new Map();

function onCreated() {
  if (browser.runtime.lastError) {
    console.log("error creating item:" + browser.runtime.lastError);
  } else {
    console.log("item created successfully");
  }
}

function GetDomain(url) {
	return url.replace('http://','').replace('https://','').split(/[/?#]/)[0];
}


function CreateContextMenus(tab) {
	var domain = GetDomain(tab.url)
	
	browser.contextMenus.create({
		id: domain,
		title: domain,
		contexts: ["all"],
	}, onCreated);
	
	browser.contextMenus.create({
		id: tab.id.toString(),
		title: tab.title,
		contexts: ["all"],
		checked: tab.active,
		parentId: domain
	}, onCreated);
	
	count = DomainMap[domain]
	if(count == undefined) {
		DomainMap[domain] = 1
	}
	else {
		DomainMap[domain] = count+1
	}
	
	TabIdToDomain[tab.id] = domain
}

function RemoveContextMenus(tabId) {
	browser.contextMenus.remove(tabId.toString())
	domain = TabIdToDomain[tabId]

	if(domain != undefined) {
		domain = TabIdToDomain[tabId]
		TabIdToDomain.delete(tabId)

		count = DomainMap[domain]
		if(count != undefined) {
			DomainMap[domain] = count-1
			console.log(DomainMap[domain])
			if(DomainMap[domain] == 0) {
				DomainMap.delete(domain)
				browser.contextMenus.remove(domain)
			}
		}
	}
}

function CreateMenus() {
	browser.tabs.query({}).then(function (tabs) {
		tabs.forEach(function(tab) {
			// console.log(tab)
			CreateContextMenus(tab)
		})
	})
}

browser.contextMenus.onClicked.addListener(function(info, tab) {
  //console.log(info)
  num = Number(info.menuItemId)
  //console.log(num)
  if(Number.isInteger(num)) {
    browser.tabs.update(Number(info.menuItemId), {active: true})
  }
});


browser.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	RemoveContextMenus(tabId)
})

browser.tabs.onCreated.addListener(function(tab) {
	CreateContextMenus(tab)
})

browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	//console.log("onUpdated")
	//console.log(tabId)
	//console.log(changeInfo)
	
	RemoveContextMenus(tabId)
	CreateContextMenus(tab)
})



CreateMenus()
