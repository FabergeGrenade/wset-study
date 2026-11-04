# Workbook structure. html=None means not written yet.
CH = [
 {"id":"1","lo":1,"title":"The vineyard","sections":[
   ("1.1","Grapes and what a vine needs","12",True,None),
   ("1.2","Ripening and concentrating sugar","13-14",False,None),
   ("1.3","Climate and weather","14-16",False,None),
   ("1.4","Vineyard choices","16-17",False,None),
   ("1.5","Label terms: origin and grape growing","17-19",False,None)]},
 {"id":"2","lo":2,"title":"Winemaking","sections":[
   ("2.1","Fermentation, red, rosé and white","20-21",True,None),
   ("2.2","Sweet wines and adjustments","22-23",False,None),
   ("2.3","Vessels, oak, malolactic, lees, blending","23-25",False,None),
   ("2.4","Bottle ageing","25",False,None)]},
 {"id":"3","lo":3,"title":"Principal black grapes","sections":[
   ("3.1","Pinot Noir","26-28",False,"PN"),
   ("3.2","Merlot","48-50",False,"ME"),
   ("3.3","Cabernet Sauvignon","51-53",False,"CS"),
   ("3.4","Syrah/Shiraz","54-56",False,"SY")]},
 {"id":"4","lo":3,"title":"Principal white grapes","sections":[
   ("4.1","Chardonnay","38-40",False,"CH"),
   ("4.2","Sauvignon Blanc","41-43",False,"SB"),
   ("4.3","Riesling and German label terms","31-34",False,"RI"),
   ("4.4","Pinot Grigio/Pinot Gris","44-45",False,"PG")]},
 {"id":"5","lo":4,"title":"Regional black grapes","sections":[
   ("5.1","Gamay","57",False,None),
   ("5.2","Grenache/Garnacha","58-59",False,None),
   ("5.3","Tempranillo","60-61",False,None),
   ("5.4","Nebbiolo, Barbera and Corvina","66-67",False,None),
   ("5.5","Sangiovese and Montepulciano","68-69",False,None),
   ("5.6","Zinfandel/Primitivo","29-30",False,None),
   ("5.7","Carmenère, Malbec and Pinotage","62-63",False,None)]},
 {"id":"6","lo":4,"title":"Regional white grapes","sections":[
   ("6.1","Chenin Blanc, Semillon and Furmint","35-37",False,None),
   ("6.2","Gewurztraminer, Viognier and Albariño","46-47",False,None),
   ("6.3","Cortese, Garganega, Verdicchio and Fiano","64-65",False,None)]},
 {"id":"7","lo":5,"title":"Sparkling and fortified","sections":[
   ("7.1","How sparkling wine is made","70-73",False,None),
   ("7.2","Sparkling wine styles","71-73",False,None),
   ("7.3","Sherry","74-75",False,None),
   ("7.4","Port","75-76",False,None)]},
 {"id":"8","lo":6,"title":"Storage, service and food","sections":[
   ("8.1","Storage, service and faults","8-11",True,None),
   ("8.2","Food and wine","6-7",True,None)]},
]

def t(head, rows):
    h = "".join(f"<th>{x}</th>" for x in head)
    b = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows)
    return f'<div class="tablewrap"><table><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div>'

HTML = {}
HTML["PN"] = f"""
<p>A thin-skinned black grape that only makes good wine in <b>cool to moderate</b> climates. Too much heat and the fresh red fruit turns cooked. It rots easily, so poor vintages are hard.</p>
<h3>In the glass</h3>
<ul><li>Pale to medium colour</li><li>High acidity, low to medium tannins</li><li>Red fruit: strawberry, raspberry, red cherry (fresh or cooked, depending on ripeness)</li><li>Oak should be subtle (smoke, cloves), so older or larger barrels are common</li><li>The best age into forest floor and mushroom</li></ul>
<h3>Burgundy, its home</h3>
<p>The best sites face south or south-east on the Côte d'Or, which splits into the <b>Côte de Nuits</b> (north) and <b>Côte de Beaune</b> (south). Quality rises up a ladder:</p>
{t(["Level","What it means"],[["Bourgogne AOC","Anywhere in Burgundy. Light, fresh, drink young."],["Village","e.g. Gevrey-Chambertin, Nuits-Saint-Georges (Côte de Nuits); Beaune, Pommard (Côte de Beaune). More intensity."],["Premier Cru","Better vineyards within a village. Village name plus Premier Cru."],["Grand Cru","The very best vineyards, with their own appellations. Most concentrated, longest-lived."]])}
<h3>Elsewhere: what makes it cool enough</h3>
{t(["Region","Cooling influence","Style note"],[["Los Carneros, California","Fog from San Pablo Bay","Ripe red fruit, often vanilla"],["Sonoma (west), California","Pacific breezes",""],["Santa Barbara County","Sea breezes",""],["Oregon","Northerly, Pacific","Fresh red fruit, subtle oak"],["Casablanca Valley, Chile","Sea breezes, fog","Very fruity, cooked strawberry, good value"],["Walker Bay, South Africa","Southerly sea breezes","Vibrant red fruit"],["Yarra Valley, Mornington Peninsula","Southern Ocean breezes","Light and fragrant to riper"],["Martinborough, Marlborough (NZ)","Cool to moderate","Very good to outstanding"],["Central Otago (NZ)","Mountains; sunny days, cool nights","NZ's ripest and most powerful"]])}
"""
HTML["ME"] = f"""
<p>A black grape for <b>moderate and warm</b> climates, with <b>medium acidity and medium tannins</b>. It is often blended with Cabernet Sauvignon to add red fruit and soften tannin, so the wine is ready sooner.</p>
<h3>Ripeness changes the style</h3>
{t(["Picked","Body","Flavours"],[["Just ripe","Light to medium","Red fruit (strawberry, red plum), green bell pepper"],["Riper (warm climate, or later picking)","Medium to full","Cooked black fruit (blackberry, black plum)"]])}
<p>Lighter styles don't need oak. Fuller styles gain softness and complexity from it. The best age into dried fruit and tobacco.</p>
<h3>Bordeaux</h3>
<p>Moderate and rainy (Atlantic). Most wines are blends, and Merlot is the most planted grape. The Gironde splits the region:</p>
<ul><li><b>Right Bank</b>: Saint-Émilion (and the stricter Saint-Émilion Grand Cru) and Pomerol. Merlot dominates. Full body, black fruit, oak, long ageing.</li><li><b>Left Bank</b>: Médoc, Graves. Merlot is in the blend but Cabernet Sauvignon usually leads.</li><li><b>Bordeaux AOC / Bordeaux Supérieur AOC</b>: from anywhere in Bordeaux, usually Merlot-led. Supérieur has slightly stricter rules.</li></ul>
<h3>Elsewhere</h3>
{t(["Region","Note"],[["South of France (Pays d'Oc)","Single-varietal and blends at all quality levels"],["California, Napa Valley, Sonoma","Fruity to concentrated; often pronounced oak (vanilla, coconut, smoke)"],["Central Valley, Chile","Soft, medium-bodied, high-volume; altitude gives fresher styles"],["Stellenbosch, South Africa","Complex, age-worthy Bordeaux varieties"],["Margaret River, Australia","Blended with Cabernet Sauvignon"],["Hawke's Bay, NZ","Most of NZ's Merlot; light to long-lived"]])}
"""
HTML["CS"] = f"""
<p>A <b>thick-skinned</b> black grape that needs a <b>long, warm</b> growing season. In moderate climates only the warmest sites ripen it.</p>
<h3>In the glass</h3>
<ul><li>Deep colour; dry, <b>high acidity, high tannins</b>, medium to full body</li><li>Black fruit (blackcurrant, black cherry) plus mint or green bell pepper</li><li>In warm climates the fruit can taste cooked</li><li>Often oak-aged: oxygen softens tannin, new oak adds smoke, vanilla, cloves</li><li>Ages for years into dried fruit, earth, forest floor</li></ul>
<h3>Bordeaux Left Bank</h3>
<p>Gravel soils help: they drain rain fast and release stored heat at night. Cabernet-led blends come from the Médoc and Haut-Médoc (which contains <b>Margaux</b> and <b>Pauillac</b>) and from Graves (which contains <b>Pessac-Léognan</b>). Bordeaux weather varies, so more Merlot goes in when Cabernet struggles.</p>
{t(["Label term","Meaning"],[["Château","Made from the producer's own grapes"],["Grand Cru Classé / Cru Classé","Ranked in a classification; top price, long ageing"],["Cru Bourgeois","Médoc wines outside the classification that may use the term; some very good"]])}
<h3>Elsewhere</h3>
{t(["Region","Note"],[["South of France","Ripens reliably; single-varietal or blends"],["Napa Valley: Oakville, Rutherford, Calistoga","Full body, ripe black fruit, high ripe tannin. Calistoga is warmest"],["Sonoma (warm inland)","Similarly powerful"],["California (state label)","Hot Central Valley, drink young, oak chips/staves"],["Maipo and Colchagua Valleys, Chile","Chile's most planted grape; foothills give mint, green pepper"],["Stellenbosch","Fresh and herbal to full and cooked, by altitude"],["Margaret River","Ripe black fruit, subtle oak; often with Merlot"],["Coonawarra","Mint, pronounced blackcurrant, smoke and cedar"],["Hawke's Bay","Needs warmest sites; blended with Merlot"]])}
"""
HTML["SY"] = f"""
<p>Syrah (French) and Shiraz (Australian) are the same <b>thick-skinned</b> black grape. It needs a <b>moderate to warm</b> climate and gives medium to high tannin and acidity. The signature is black fruit with <b>black pepper</b>.</p>
{t(["Climate","Typical style","Name usually used"],[["Moderate (Northern Rhône)","Medium body, fresh black fruit (black cherry, blackberry), herbal notes, black pepper","Syrah"],["Warm (much of Australia)","Full body, high alcohol, cooked black fruit, liquorice","Shiraz"]])}
<p>Outside France and Australia, the name on the label hints at the style. Oak is common (softer tannin, smoke, spice). The best age a decade or more into dried fruit, leather, meat and earth. It is often blended with Grenache in the Southern Rhône.</p>
<h3>Northern Rhône</h3>
<p>Syrah is the only black grape allowed in its AOC wines. Steep slopes mean hand work and high costs.</p>
<ul><li><b>Côte-Rôtie</b>: far north, very steep. Complex, peppery; some add a little Viognier for floral notes.</li><li><b>Hermitage</b>: one steep south-facing hill. High quality.</li><li><b>Crozes-Hermitage</b>: larger, flatter area around it. Less intense, cheaper.</li></ul>
<h3>Elsewhere</h3>
{t(["Region","Note"],[["South of France: Minervois, Pays d'Oc","Blends and single-varietal; ripens reliably"],["South Eastern Australia","Inexpensive high-volume, warm inland"],["Barossa Valley","Very old vines: full body, ripe tannin, cooked black fruit, pepper, vanilla, coffee"],["Hunter Valley","Warm but cloudy: medium body, fresh black fruit; earth and meat with age"]])}
"""
HTML["CH"] = f"""
<p>A white grape that makes outstanding wine in <b>cool, moderate and warm</b> climates. Climate decides the fruit, body and acidity:</p>
{t(["Climate","Acidity","Body","Flavours"],[["Cool","High","Light to medium","Apple, pear, lemon, lime, wet stones"],["Moderate","Medium to high","Medium to full","Lemon, peach, sometimes melon"],["Warm","Medium","Full","Peach, pineapple, banana"]])}
<h3>Winemaking choices (all optional)</h3>
<ul><li><b>Malolactic conversion</b>: butter, cream; softens acidity</li><li><b>Lees contact</b>: body, bread, biscuit</li><li><b>Oak</b> (barrel or cheaper chips/staves): body, smoke, vanilla, coconut</li><li><b>Acidification</b>: common in warm climates to balance alcohol and body</li><li>Unoaked styles may say "unoaked" or "unwooded"</li></ul>
<p>The best age for decades into hazelnut and mushroom.</p>
<h3>Burgundy</h3>
{t(["Appellation","Style"],[["Bourgogne AOC","Simple, apple and lemon, high acidity"],["Chablis (cool, north)","Apple, lemon, wet stones; almost never oaky. Premier/Grand Cru on south-facing slopes. Frost risk"],["Meursault, Puligny-Montrachet (Côte de Beaune)","Riper (peach, melon); oak and lees; the best are world-class"],["Mâcon (south)","Fruity, mostly unoaked: lemon, peach, melon"],["Pouilly-Fuissé (Mâconnais)","Concentrated stone and tropical fruit, often oaked"]])}
<h3>Elsewhere</h3>
{t(["Region","Note"],[["South of France (IGP)","Warm, ripe peach, pineapple, banana"],["California (state label)","Hot Central Valley, high volume, oak chips"],["Carneros, Sonoma","Fog or Pacific breezes keep acidity"],["Napa Valley","Full body, tropical fruit, new oak"],["Santa Barbara County","Côte de Beaune-like to riper and oakier"],["Oregon","Moderate; high acidity, lemon to melon"],["South Eastern Australia","High-volume, warm inland, often blended"],["Adelaide Hills (altitude), Yarra Valley (ocean)","Ripe peach, medium to high acid, balanced oak"],["Margaret River","Warm, sea breezes; medium to full, peach, pineapple"],["Marlborough","Lemon, peach, melon, high acid, subtle oak"],["Hawke's Bay","Most planted white grape there; full body, high acid"],["Casablanca Valley / Central Valley, Chile","Fresh citrus and peach / all quality levels"],["Western Cape / Walker Bay","High-volume inland / very good, high acid, ripe fruit"]])}
"""
HTML["SB"] = f"""
<p>An <b>aromatic</b> white grape for <b>cool and moderate</b> climates. Usually dry, light to medium body, <b>high acidity</b>, and best drunk young: even top examples can turn vegetal within a couple of years.</p>
<ul><li>Herbaceous: grass, green bell pepper, asparagus; also blossom</li><li>Fruit by ripeness: apple and gooseberry, wet stones, up to passion fruit</li><li>Mostly unoaked, as new oak swamps it. "Barrel aged" on the label signals oak</li><li>Sometimes blended with Semillon</li></ul>
<h3>France</h3>
{t(["Appellation","Style"],[["Sancerre, Pouilly-Fumé (Loire, cool)","Dry, high acid, apple, grass, asparagus, wet stones"],["Touraine (Loire)","Fruity, inexpensive"],["Bordeaux AOC","Fresh grass and green apple"],["Graves, Pessac-Léognan","Blended with Sémillon (body, ageing); often oaked; honey and nuts with age"],["South of France (cooler, high sites)","Dry, high acid, passion fruit, grass"]])}
<h3>Elsewhere</h3>
{t(["Region","Note"],[["Marlborough, NZ","More pronounced than Loire: lemon to passion fruit, strong green bell pepper and asparagus. Some oak or lees experiments"],["Margaret River","Grassy; often blended with Semillon, sometimes oaked"],["Adelaide Hills","Most planted grape there; citrus to tropical"],["Casablanca Valley / Central Valley, Chile","Very good / all quality levels"],["Constantia, South Africa","Sea breezes; tropical and herbaceous"],["Elgin, South Africa","Altitude, coolest region; green apple, wet stones"],["Napa Valley","Cooler sites, early picking; sometimes oak (smoke)"]])}
"""
HTML["RI"] = f"""
<p>An <b>aromatic</b>, cold-hardy white grape for <b>cool to moderate</b> climates, with <b>high acidity</b> and pronounced fruit and floral aromas. It is made at every sweetness level, and its acidity balances sweetness.</p>
<ul><li>Just ripe: apple, pear, lemon, lime. Extra ripe: peach, apricot, mango, pineapple, even dried fruit</li><li>Sugar can be concentrated by late harvest, noble rot, or freezing on the vine</li><li>Off-dry/medium: stop fermentation by removing yeast, or add sterile grape juice (Süssreserve)</li><li>Fermented in inert vessels to keep its aromas. The best age for decades into honey and petrol</li></ul>
<h3>Germany</h3>
{t(["Region","Style"],[["Mosel","Far north. Light body, often medium-sweet, very high acidity. Steep riverside slopes"],["Rheingau","South-facing slopes on the Rhine. Drier and fuller than Mosel"],["Pfalz","Sheltered by mountains, sunny. Dry, medium body, like Alsace"]])}
<h3>German label terms</h3>
{t(["Term","Meaning"],[["Landwein","PGI; light, dry to off-dry"],["Qualitätswein","PDO from one of 13 regions"],["Prädikatswein","PDO with riper grapes from one region; six Prädikat categories"],["Kabinett","Lightest; green apple, lime, blossom"],["Spätlese","Late harvest; fuller, riper citrus, some peach"],["Auslese","Selected extra-ripe bunches; apricot, mango, dried fruit"],["Beerenauslese (BA)","Botrytis-affected berries; sweet, honey"],["Trockenbeerenauslese (TBA)","Berries dried by botrytis; rarest, most intense"],["Eiswein","Frozen on the vine; no botrytis; pure fresh fruit"],["Trocken / Halbtrocken","Dry / some sweetness"]])}
<p>Kabinett, Spätlese and Auslese can be dry. If they are, the higher Prädikat has more alcohol. BA, TBA and Eiswein are always sweet and low in alcohol.</p>
<h3>Elsewhere</h3>
{t(["Region","Note"],[["Alsace","Vosges block rain. Dry, pronounced ripe citrus, stone fruit, blossom. Grand Cru sites; Vendanges tardives for late-harvest"],["Clare Valley, Eden Valley","Altitude makes them moderate. Dry: lime, peach, blossom, petrol"]])}
"""
HTML["PG"] = f"""
<p>Pinot Grigio (Italian name) and Pinot Gris (French name) are the <b>same white grape</b>, grown in cool or moderate climates. Vineyard choices create two very different styles:</p>
{t(["","Light style","Rich style"],[["How","High yields, picked early","Controlled yields, picked late (extra ripe)"],["Body","Light","Medium to full"],["Acidity","High","Medium"],["Flavours","Simple apple, lemon","Lemon, peach, mango, banana, ginger"],["Sweetness","Dry","Dry to medium"],["Ageing","Drink young","Can gain ginger and honey"]])}
<p>Both are usually fermented in inert vessels. Outside Italy and France, "Pinot Grigio" on a label usually signals the light style and "Pinot Gris" the richer one.</p>
<h3>Italy</h3>
<ul><li><b>delle Venezie DOC / Veneto IGT</b>: north-east Italy. High-volume, inexpensive, light, short finish.</li><li><b>Friuli-Venezia Giulia</b>: fuller, more complex.</li></ul>
<h3>Alsace</h3>
<p>Picked extra-ripe: medium to full body, peach, mango, ginger, dry to medium. Best from grand cru sites.</p>
{t(["Label term","Meaning"],[["Alsace AOC","Whole region; labelled by grape"],["Alsace Grand Cru AOC","Steep east/south-east Vosges slopes; only Riesling, Pinot Gris, Gewurztraminer"],["Vendanges tardives (VT)","Alsace-only 'late harvest'; usually medium to sweet"]])}
"""
