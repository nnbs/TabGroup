
var DomainMap = new Map();
var TabIdToDomain = new Map();

function onCreated() {
  if (browser.runtime.lastError) {
    console.log("error creating item:" + browser.runtime.lastError);
  } else {
    console.log("item created successfully");
  }
}

function extractHostname(url) {
  return url.replace('http://','').replace('https://','').split(/[/?#]/)[0];
}

function extractRootDomain(url) {
    var domain = extractHostname(url),
        splitArr = domain.split('.'),
        arrLen = splitArr.length;

    //extracting the root domain here
    //if there is a subdomain 
    if (arrLen > 2) {
        domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
        //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
        if (splitArr[arrLen - 1].length == 2 && splitArr[arrLen - 1].length == 2) {
            //this is using a ccTLD
            domain = splitArr[arrLen - 3] + '.' + domain;
        }
    }

    return domain;
}

function GetDomain(url) {
	//return url.replace('http://','').replace('https://','').split(/[/?#]/)[0];
	domain = extractRootDomain(url)
	return domain.replace(/([^\/]+):([0-9]+)/, "$1");
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
			//console.log(DomainMap[domain])
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

function UpdateContextMenus(tabId, tab) {
	
	OldDomain = TabIdToDomain[tabId]
	NewDomain = GetDomain(tab.url)
	
	if(OldDomain == NewDomain) {
		browser.contextMenus.update(tabId.toString(), {title: tab.title});
	}else {
		RemoveContextMenus(tabId)
		CreateContextMenus(tab)
	}
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
	
	if(!changeInfo.title)
		return
	
	UpdateContextMenus(tabId, tab)

})



CreateMenus()
