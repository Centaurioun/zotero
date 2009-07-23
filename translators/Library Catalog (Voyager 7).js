{
	"translatorID":"a81243b5-a9fd-4921-8441-3142a518fdb7",
	"translatorType":4,
	"label":"Library Catalog (Voyager 7)",
	"creator":"Sean Takats",
	"target":"/vwebv/(holdingsInfo|search)",
	"minVersion":"1.0",
	"maxVersion":"",
	"priority":100,
	"inRepository":true,
	"lastUpdated":"2009-07-23 10:00:00"
}

function detectWeb(doc, url){
	var bibIdRe = new RegExp("bibId=[0-9]+");
	if (bibIdRe.test(url)){
		return "book";
	}
	
	var namespace = doc.documentElement.namespaceURI;
	var nsResolver = namespace ? function(prefix) {
		if (prefix == 'x') return namespace; else return null;
	} : null;	
	
	var titles = doc.evaluate('//div[@class="resultListTextCell"]/div/label', doc, nsResolver, XPathResult.ANY_TYPE, null);
	if (titles.iterateNext()){
		return "multiple";
	}
}

function doWeb(doc, url){
	var bibIdRe = new RegExp("bibId=([0-9]+)");
	var m = bibIdRe.exec(url);
	var hostRegexp = new RegExp("^(https?://[^/]+)/");
	var hMatch = hostRegexp.exec(url);
	var host = hMatch[1];
	
	var namespace = doc.documentElement.namespaceURI;
	var nsResolver = namespace ? function(prefix) {
		if (prefix == 'x') return namespace; else return null;
	} : null;
	
	var newUris = new Array();

	if (m){ //single item
		newUris.push(host + "/vwebv/exportRecord.do?bibId=" + m[1] + "&format=utf-8");
	}
	else { //search results
		var items = new Object();
		var titles = doc.evaluate('//div[@class="resultListTextCell"]/div/label', doc, nsResolver, XPathResult.ANY_TYPE, null);
		var title;
		
		while (title = titles.iterateNext()) {
			var bibId = doc.evaluate('@for', title, nsResolver, XPathResult.ANY_TYPE, null).iterateNext().textContent;
			items[bibId] = title.textContent;
		}
		items = Zotero.selectItems(items);
		for (var i in items) {
			newUris.push(host + "/vwebv/exportRecord.do?bibId=" + i + "&format=utf-8");
		}
	}

	Zotero.Utilities.HTTP.doGet(newUris, function(text) {
		// load translator for MARC
		var marc = Zotero.loadTranslator("import");
		marc.setTranslator("a6ee60df-1ddc-4aae-bb25-45e0537be973");
		marc.setString(text);
		
		var domain = url.match(/https?:\/\/([^/]+)/);
		marc.setHandler("itemDone", function(obj, item) {
			item.repository = domain[1]+" Library Catalog";
			item.complete();
		});

		marc.translate();
		
		Zotero.done();
		})
	
	Zotero.wait();
}
