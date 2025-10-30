const tiles = [];
var errorTiles = [];
const details = [];
const tilemap = [];

var tileSize = 100;

var canvasWidth = 1000;
var canvasHeight = 1000;

var drawGrid = false;

var fullyTiled = false;
var fullyDetailed = false;

var failed = false;
var hiliteLastUpdatedCell = true;
var lastUpdatedCell = null;
var showEntropy = true;

var seed = 2;

class Tile{

    constructor(imageSource, connections, rotation, weight){
        this.image = imageSource;   
        this.rotation = rotation;
        //up=0, right=1, left=2, down=3;
        this.connections = connections.slice();
        this.permittedUp = [];
        this.permittedRight = [];
        this.permittedDown = [];
        this.permittedLeft = [];
        this.weight = weight;        
    }
    get Image(){
        return this.image;
    }
    get Up(){
        return this.connections[0];
    }
    get Right(){
        return this.connections[1];
    }
    get Down(){
        return this.connections[2];
    }
    get Left(){
        return this.connections[3];
    }
    get Rotation(){
        return this.rotation;
    }
    get Weight(){
        return this.weight;
    }
    get Contents(){
        if(this.contents == undefined){
            var content = "";
            // for(var i=0;i<this.connections.length;i++){
            //     content += this.connections[i];
            // }
            content += this.Up;
            content += this.Right;
            content += this.Down;
            content += this.Left;

            // console.log(content);
            this.contents = content
                .split("")
                .filter((val, i, arr) => arr.indexOf(val) === i)
                .sort((a,b) => {
                    if(a > b) return 1;
                    if(b > a) return -1;
                    return 0;
                }).join("");
            
        }
        return this.contents;
    }
    
    checkConnections(tiles){
        //check which tiles within the list can be connected to, and remember their indexes in permitted[x]
        if(typeof(tiles[0].Up) == "number"){
            for(var t=0;t<tiles.length;t++){
                var tile = tiles[t];
    
                if(this.Up == tile.Down) this.permittedUp.push(t);
                if(this.Right == tile.Left) this.permittedRight.push(t);
                if(this.Down == tile.Up) this.permittedDown.push(t);
                if(this.Left == tile.Right) this.permittedLeft.push(t);
    
            }
        }else{
            for(var t=0;t<tiles.length;t++){
                var tile = tiles[t];
                //optional rule i might toggle later
                // if(tile == this) continue;
    
                if(this.Up == reverseString(tile.Down)) this.permittedUp.push(t);
                if(this.Right == reverseString(tile.Left)) this.permittedRight.push(t);
                if(this.Down == reverseString(tile.Up)) this.permittedDown.push(t);
                if(this.Left == reverseString(tile.Right)) this.permittedLeft.push(t);
            }
        }

    }

    rotated(rotation){
        var output = new Tile(this.Image, this.connections, rotation, this.weight);
        //do something for each 90deg we rotate
        var rotationScale = rotation / 90;
        for(var i=0;i<4;i++){
            // console.log(output);
            output.connections[i] = this.connections[(i - rotationScale + 4) % 4];
        }
        return output;
    }
}

class Detail{
    constructor(imageSource, connections, requirements, incompatibilities, rotation, weight){
        this.image = imageSource;   
        this.rotation = rotation;
        this.incompatable = incompatibilities;
        //up=0, right=1, left=2, down=3;
        this.connections = connections.slice();
        this.requirements = requirements.slice();
        this.permittedUp = [];
        this.permittedRight = [];
        this.permittedDown = [];
        this.permittedLeft = [];
        this.permittedOn = [];
        this.weight = weight;
    }
    get Image(){
        return this.image;
    }

    get Up(){
        return this.connections[0];
    }
    get Right(){
        return this.connections[1];
    }
    get Down(){
        return this.connections[2];
    }
    get Left(){
        return this.connections[3];
    }
    get Rotation(){
        return this.rotation;
    }
    get Weight(){
        return this.weight;
    }
    checkConnections(details, tiles){
        //check which details within the list can be connected to, and remember their indexes in permitted[x]
        for(var t=0;t<details.length;t++){
            var tile = details[t];
            //optional rule i might toggle later
            // if(tile == this) continue;
            if(this.Up == reverseString(tile.Down)) this.permittedUp.push(t);
            if(this.Right == reverseString(tile.Left)) this.permittedRight.push(t);
            if(this.Down == reverseString(tile.Up)) this.permittedDown.push(t);
            if(this.Left == reverseString(tile.Right)) this.permittedLeft.push(t);
        }

        //then, for tiles they can fit ON
        for(var t=0;t<tiles.length;t++){
            var tile = tiles[t];
            if(!this.checkCompatible(tile)) continue;

            if(this.checkFit(this.requirements.slice(), tile.connections.slice())){
                this.permittedOn.push(t);
            }
        }
    }
    checkFit(mine, theirs){
        //strings will look like this:
        // "#p#" for 'mine'
        //and "ppp" for 'theirs'
        //# is wild, so for each of mine that arent #, i see if i can fit.
        if(mine.length != theirs.length) return false; //there should always be 4 of each array.
        // console.log(mine + "/" + theirs);
        for(var i=0;i<mine.length;i++){
            
            var me = mine[i].split("");
            var them = reverseString(theirs[i]).split("");
            
            if(me.length != them.length) return false; //there should always be 3 in each side
            for(var s=0;s<me.length;s++){
                // console.log(me[s] + "/" + them[s] + "/" + s);
                if(me[s] == "#") continue;
                if(me[s] == them[s]) continue;
                //failure condition: my connection isnt wild and doesnt match the input
                return false;
            }
        }
        return true;
    }
    checkCompatible(tile){
        var incom = this.incompatable.split("");
        // console.log(tile.Contents);
        for(var i=0;i<incom.length;i++){
            if(tile.Contents.includes(incom[i])) return false;
        }
        return true;
    }

    rotated(rotation){
        var output = new Detail(this.Image, this.connections, this.requirements, this.incompatable, rotation, this.weight, this.bannedContent);
        //do something for each 90deg we rotate
        var rotationScale = rotation / 90;
        for(var i=0;i<4;i++){
            // console.log(output);
            output.connections[i] = this.connections[(i - rotationScale + 4) % 4].slice();
        }

        for(var i=0;i<4;i++){
            // console.log(output);
            output.requirements[i] = this.requirements[(i - rotationScale + 4) % 4].slice();
        }
        return output;
    }
}

class Cell{
    constructor(tile, collapsed, posX, posY){
        this.tile = tile;
        this.detail = null;
        this.collapsed = collapsed;
        //TODO: Replace with 'Tiled' and 'Detailed' to separate tiles (terrain) from details (roads, towns, etc.)
        this.finished = false;
        this.tiled = false;
        this.detailed = false;
        this.detailable = true;
        this.options = [];
        for(var x = 0; x < tiles.length; x++){
            this.options.push(x);
        }
        this.posX = posX;
        this.posY = posY;
        this.priority = false;
    }

    setTile(til){
        this.tile = til;
        this.options = [];
    }
    setDetail(det){
        this.detail = det;
        this.options = [];
    }
    get Tile(){
        return tiles[this.tile];
    }
    get Detail(){
        return details[this.detail];
    }

    get Options(){
        return this.options;
    }
    get Entropy(){
        return this.options.length;
    }
    get WeightedEntropy(){
        if(!this.tiled) return this.WeightedEntropyTiles;
        else return this.WeightedEntropyDetails;
    }
    get WeightedEntropyTiles(){
        var WEntropy = 0;
        for(var i=0;i<this.options.length;i++){
            WEntropy += tiles[this.options[i]].Weight;
        }
        return WEntropy;
    }

    get WeightedEntropyDetails(){
        var WEntropy = 0;
        for(var i=0;i<this.options.length;i++){
            WEntropy += details[this.options[i]].Weight;
        }
        return WEntropy;
    }

    collapseable(allowedValues){
        return this.options.slice().filter((v, i, arr) => {
            return allowedValues.includes(v);
        }).length > 0;
    }

    updateEntropy(allowedValues){
        this.options = this.options.filter((v, i, arr) => {
            return allowedValues.includes(v);
        });
    }
}

function updateSize(tileSize, tilesWide, tilesTall){
    console.log("AAAA");
    tileSize = tileSize;
    canvasWidth = tileSize * tilesWide;
    canvasHeight = tileSize * tilesTall;

    console.log(`${tileSize}/${canvasWidth}/${canvasHeight}`);
}
function loadImage(url, rotation){
    var img = new Image();
    img.src = url;
    if(rotation > 0){
        img.style = `transform: rotate(${rotation % 360}deg)`;
    }
    img.addEventListener('load', e => {
        // console.log(e.src);
    });
    return img;
}

function addTile(tile, extraRotations){
    tiles.push(tile);
    for(var i=1;i<=extraRotations;i++){
        tiles.push(tile.rotated(i*90));
    }
}
function addDetail(detail, extraRotations, rotateImage){
    details.push(detail);
    for(var i=1;i<=extraRotations;i++){
        var det = detail.rotated(i*90);
        if(!rotateImage) det.rotation = 0;
        details.push(det);
    }
}

function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function reverseString(str){
    return str.split("").reverse().join("");
}

function showGrid(show){
    drawGrid = show;
}

function validateCell(cell, sourceIndex, sourceArray){
    var x = cell.posY;
    var y = cell.posX;

    var tileHeight = canvasHeight / tileSize;
    // var myIndex = y * tileHeight + x;
    var index = y * tileHeight + x;

    //check to make sure this choice doesn't prevent other tiles from becoming un-collapseable
    if(x > 0){
        if(!tilemap[index - 1].collapseable(sourceArray[sourceIndex].permittedLeft)){
            if(!tilemap[index - 1].collapsed)
                return false;
        }
    }
    if(x < tileHeight-1){
        if(!tilemap[index + 1].collapseable(sourceArray[sourceIndex].permittedRight)){
            if(!tilemap[index + 1].collapsed)
                return false;
        }
    }

    if(y > 0){
        if(!tilemap[index - tileHeight].collapseable(sourceArray[sourceIndex].permittedUp)){
            if(!tilemap[index - tileHeight].collapsed)
                return false;
        }
    }
    if(y < tileHeight-1){
        if(!tilemap[index + tileHeight].collapseable(sourceArray[sourceIndex].permittedDown)){
            if(!tilemap[index + tileHeight].collapsed)
                return false;
        }
    }
    return true;
}

function collapseRandomCellTile(){
    if(failed) return false;

    var tilemapCopy = tilemap.slice();
    //copy the tiles array to find the tile with the least options
    tilemapCopy.sort((a,b) => {
        if(a.tiled) return 1;
        if(b.tiled) return -1;
        return a.Entropy - b.Entropy;
    });

    if(tilemapCopy[0].collapsed){
        // console.log("No More Choices");
        return {value: false, reason:"Map Full"};
    }

    for(let i=0;i<tilemapCopy.length;i++){
        if(tilemapCopy[i].Options.length > tilemapCopy[0].Options.length){
            tilemapCopy.splice(i);
            break;
        }else if(tilemapCopy[i].collapsed){
            tilemapCopy.splice(i);
            break;
        }
    }
    //choose a tile from the one with the least options, and fill it randomly
    // console.log(tilemapCopy);
    const randCell = Math.floor(random() * tilemapCopy.length);
    const cell = tilemapCopy[randCell];
    // console.log(seed);
    return collapseCellTile(cell);
}
function collapseCellTile(cell){
    if(failed) return {value: false, reason: "Internal Failure"};
    lastUpdatedCell = cell;
    // console.log(cell);
    var tileWidth = canvasWidth / tileSize;
    var tileHeight = canvasHeight / tileSize;

    cell.collapsed = true;


    while(cell.options.length > 0){
        // console.log("here");
        var weightedOption = Math.floor(random() * cell.WeightedEntropyTiles);
        var tileSelected = 0;
        var option = 0;
        for(var i=0;i<cell.Entropy;i++){
            var checkTile = tiles[cell.options[i]];
            //hopefully tiles with 0 weight are picked last.
            if(checkTile.weight == 0 && cell.WeightedEntropy > 0) continue;
            weightedOption -= checkTile.weight;
            if(weightedOption <= 0){
                
                tileSelected = cell.options[i];
                option = i;

                // console.log("Chosen a Tile: " + tileSelected);
                // console.log(tiles);
                break;
            }
        }
        if(tileSelected == null){
            alert("Error Occurred Collapsing " + cell);
        }
        // const tileSelected = cell.Options[option];
        
        
        var failure = !validateCell(cell, tileSelected, tiles);


        
        if(failure){
            // console.log("Failed Once, " + cell.Entropy + " remain");
            // console.log(cell);
            // console.log(tileSelected);
            
            // alert(cell.options.length);
            if(cell.options.length <= 1){
                console.log("un-collapsable tile");
                cell.tiled = true;

                return {value: false, reason:"Impossible Tile"};
            }else 
                cell.options.splice(option, 1);
            continue;
        }else{
            // console.log("success");
            // console.log(tileSelected);
            cell.setTile(tileSelected);
            break;
        }

    }

    // console.log(cell);
    
    //update the neighbouring tiles with their new limitations
    for(var x=0; x<tileWidth;x++){
        for(var y=0; y<tileHeight; y++){
            var updating = tilemap[y * tileHeight + x];
            if(!updating.tiled && updating.collapsed){
                
                //we find the neighbours
                //left 1
                if(x != 0){
                    tilemap[y * tileHeight + x - 1].updateEntropy(updating.Tile.permittedLeft);
                }
                if(x < tileWidth-1){
                    tilemap[y * tileHeight + x + 1].updateEntropy(updating.Tile.permittedRight);
                }

                if(y != 0){
                    tilemap[(y-1) * tileHeight + x].updateEntropy(updating.Tile.permittedUp);
                }
                if(y < tileHeight-1){
                    tilemap[(y+1) * tileHeight + x].updateEntropy(updating.Tile.permittedDown);
                }
                updating.tiled = true;
            }
        }
    }
    return {value: true, reason: "Success"};
}

function collapseRandomCellDetail(){
    if(failed) return false;
    var tilemapCopy = tilemap.slice();
    //copy the tiles array to find the tile with the least options
    tilemapCopy.sort((a,b) => {
        if(a.detailed || a.collapsed) return 1;
        if(b.detailed || b.collapsed) return -1;
        return a.Entropy - b.Entropy;
    });

    if(tilemapCopy[0].collapsed){
        console.log("No More Choices");
        return {value: false, reason:"Map Fully Detailed"};
    }
    if(tilemapCopy[0].options.length == 0){
        // console.log("Zero Options");
        // console.log(tilemapCopy);
    }

    for(let i=0;i<tilemapCopy.length;i++){
        if(tilemapCopy[i].Options.length > tilemapCopy[0].Options.length){
            tilemapCopy.splice(i);
            break;
        }else if(tilemapCopy[i].collapsed){
            tilemapCopy.splice(i);
            break;
        }
    }
    //choose a tile from the one with the least options, and fill it randomly
    // console.log(tilemapCopy);
    const randCell = Math.floor(random() * tilemapCopy.length);
    const cell = tilemapCopy[randCell];
    // console.log(seed);
    return collapseCellDetail(cell);
}
function collapseCellDetail(cell){
    if(failed) return {value: false, reason: "Internal Failure"};

    lastUpdatedCell = cell;
    // console.log(cell);
    var tileWidth = canvasWidth / tileSize;
    var tileHeight = canvasHeight / tileSize;

    cell.collapsed = true;

    while(cell.options.length > 0){
        // console.log("here");
        var weightedOption = Math.floor(random() * cell.WeightedEntropyDetails);
        var tileSelected = 0;
        var option = 0;
        for(var i=0;i<cell.Entropy;i++){
            var checkTile = details[cell.options[i]];
            //hopefully tiles with 0 weight are picked last.
            if(checkTile.weight == 0 && cell.WeightedEntropyDetails > 0){
                // console.log("Ignoring Unweighted Detail");
                continue;
            }
            weightedOption -= checkTile.weight;
            if(weightedOption <= 0){
                
                tileSelected = cell.options[i];
                option = i;

                // console.log("Chosen a Detail: " + tileSelected);
                // console.log(cell.options);
                // console.log(tiles);
                break;
            }
        }



        if(tileSelected == null){
            alert("Error Occurred Collapsing " + cell);
        }
        // const tileSelected = cell.Options[option];
        
        
        var failure = {condition: false, reason: ""};
        //first check: current tile can support the detail
        if(!details[tileSelected].permittedOn.includes(cell.tile)){
            failure.condition = true;
            failure.reason = "Tile cannot support Detail";
        }

        var tileX = cell.posY;
        var tileY = cell.posX;

        var index = tileY * tileHeight + tileX;
        var tileSize = canvasWidth / tileSize;

        // console.log(tileX + "/" + tileY);
        // console.log(details[tileSelected]);

        if(!validateCell(cell, option, details)){
            failure.condition = true;
            failure.reason = "Makes Another Tile Illegal";
        }

        if(tileX > 0){
            if(!tilemap[index - 1].detailable && details[tileSelected].Left != "###"){
                // failure = true;
                // console.log(tilemap[index - 1]);
                // console.log("Left Connection Illegal");
                failure.condition = true;
                failure.reason = "Left Connection Illegal";
            }
        }

        if(tileX < tileSize - 1){
            if(!tilemap[index + 1].detailable && details[tileSelected].Right != "###"){
                // failure = true;
                // console.log("Right Connection Illegal");
                failure.condition = true;
                failure.reason = "Right Connection Illegal";
            }
        }

        
        if(tileY < tileSize - 1){
            if(!tilemap[index + tileSize].detailable && details[tileSelected].Down != "###"){
                // failure = true;
                // console.log("Down Connection Illegal");
                failure.condition = true;
                failure.reason = "Down Connection Illegal";
            }
        }

        if(tileY > 0){
            if(!tilemap[index - tileSize].detailable && details[tileSelected].Up != "###"){
                // failure = true;
                // console.log("Up Connection Illegal");
                failure.condition = true;
                failure.reason = "Up Connection Illegal";
            }
        }
        
        if(failure.condition){
            // console.log(failure.reason);
            // console.log("Failed Once, " + cell.Entropy + " remain");
            // console.log(cell);
            // console.log(tileSelected);
            
            // alert(cell.options.length);
            if(cell.options.length <= 1){
                console.log("un-collapsable tile");
                console.log(cell);
                cell.detailed = true;
                return {value: false, reason:"Impossible Details"};
            }else 
                cell.options.splice(option, 1);
            continue;
        }else{
            // console.log("success");
            // console.log(cell);
            cell.setDetail(tileSelected);
            break;
        }

    }

    // console.log(cell);
    
    //update the neighbouring tiles with their new limitations
    for(var x=0; x<tileWidth;x++){
        for(var y=0; y<tileHeight; y++){
            var updating = tilemap[y * tileHeight + x];
            if(!updating.detailed && updating.detail != undefined){
                
                //we find the neighbours
                //left 1
                if(x != 0){
                    tilemap[y * tileHeight + x - 1].updateEntropy(updating.Detail.permittedLeft);
                }
                if(x < tileWidth-1){
                    tilemap[y * tileHeight + x + 1].updateEntropy(updating.Detail.permittedRight);
                }

                if(y != 0){
                    tilemap[(y-1) * tileHeight + x].updateEntropy(updating.Detail.permittedUp);
                }
                if(y < tileHeight-1){
                    tilemap[(y+1) * tileHeight + x].updateEntropy(updating.Detail.permittedDown);
                }
                updating.detailed = true;
            }
        }
    }

    return {value: true, reason: "Success"};
}
function getTileIndex(tilex, tiley){
    return tiley * (canvasHeight / tileSize) + tilex;
}
function setCell(x, y, tileIndex){
    setCellInternal(tilemap[getTileIndex(x,y)], tileIndex);
}
function setCellInternal(cell, tileIndex){
    cell.options = [tileIndex];
    collapseCellTile(cell);
}
function setDetail(x, y, detailIndex){
    tilemap[getTileIndex(x,y)].options = [detailIndex];
    collapseCellDetail(tilemap[getTileIndex(x,y)]);
}
function updateNeighbours(cell){
    var x = cell.posY;
    var y = cell.posX;

    var tileHeight = canvasHeight / tileSize;
    var myIndex = y * tileHeight + x;
                
    //we find the neighbours
    //left 1
    if(x > 0){
        tilemap[myIndex - 1].updateEntropy(cell.Detail.permittedLeft);
    }
    if(x < tileHeight-1){
        tilemap[myIndex + 1].updateEntropy(cell.Detail.permittedRight);
    }

    if(y > 0){
        tilemap[myIndex - tileHeight].updateEntropy(cell.Detail.permittedUp);
    }
    if(y < tileHeight-1){
        tilemap[myIndex + tileHeight].updateEntropy(cell.Detail.permittedDown);
    }
    cell.collapsed = true;
    // cell.detailed = true;
}

function reset(sentSeed){
    if(tilemap != undefined)
        tilemap.splice(0, tilemap.length);

    if(sentSeed != 0){
        seed = sentSeed;
    }else{
        seed = Math.round(Date.now() % 10000);
        console.log(seed);
    }

    var tileWidth = canvasWidth / tileSize;
    var tileHeight = canvasHeight / tileSize;
    for(var x=0; x<tileWidth;x++){
        for(var y=0; y<tileHeight; y++){
            tilemap.push(new Cell(null, false, x, y));
        }
    }

    // console.log(tilemap);
    failed = false;

    fullyTiled = false;
    fullyDetailed = false;

    lastUpdatedCell = null;
}
//p-light grass, g-gray road, y-yellow road, f-green forest, r-river, l-lake, m-mountain
function setup(sentSeed){
    var filePath = "res/";
    loadTiles(filePath);
    loadDetails(filePath);

    reset(sentSeed);

    // console.log(tilemap);
    // console.log(tiles);
    // console.log(details);

    // setCell(tilemap[0], 9);
    // setCell(tilemap[2], 9);
    // setCell(tilemap[11], 27);

}
function loadTiles(filePath){
    //                                               Key:  Up    Right Down  Left
    //tiles: square same
    addTile(new Tile(loadImage(filePath + "WFT2_11.png"), ["ppp","ppp","ppp","ppp"], 0, 8), 0);
    addTile(new Tile(loadImage(filePath + "WFT2_12.png"), ["fff","fff","fff","fff"], 0, 3), 0);
    addTile(new Tile(loadImage(filePath + "WFT2_20.png"), ["lll","lll","lll","lll"], 0, 4), 0);
    addTile(new Tile(loadImage(filePath + "WFT2_31.png"), ["mmm","mmm","mmm","mmm"], 0, 1), 0);
    //tiles: all plains
    addTile(new Tile(loadImage(filePath + "WFT2_55.png"), ["ppp","ppp","ppp","ppp"], 0, 3), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_56.png"), ["ppp","ppp","ppp","ppp"], 0, 3), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_57.png"), ["ppp","ppp","ppp","ppp"], 0, 3), 3);
    //tiles: all forest
    addTile(new Tile(loadImage(filePath + "WFT2_13.png"), ["ppp","fff","fff","ppp"], 0, 3), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_14.png"), ["ppp","ppf","fpp","ppp"], 0, 3), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_15.png"), ["ppp","ppf","fff","fpp"], 0, 3), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_16.png"), ["ppp","fff","fff","fpp"], 0, 3), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_17.png"), ["ppp","ppf","fff","ppp"], 0, 3), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_18.png"), ["ppp","ppp","fff","fpp"], 0, 3), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_19.png"), ["ppp","ppp","fff","ppp"], 0, 3), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_43.png"), ["ppf","fff","fff","fpp"], 0, 3), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_44.png"), ["ppp","ppf","ppp","ppp"], 0, 3), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_45.png"), ["ppp","ppp","ppp","fpp"], 0, 3), 3);
    //tiles: all water
    addTile(new Tile(loadImage(filePath + "WFT2_21.png"), ["ppp","prp","ppp","prp"], 0, 2), 1);
    addTile(new Tile(loadImage(filePath + "WFT2_22.png"), ["ppp","ppp","prp","prp"], 0, 2), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_23.png"), ["prp","prp","ppp","prp"], 0, 0), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_24.png"), ["ppp","ppl","lll","lpp"], 0, 2), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_25.png"), ["ppp","ppp","ppl","lpp"], 0, 2), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_26.png"), ["lpp","prp","ppl","lll"], 0, 2), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_27.png"), ["ppp","ppp","ppp","prp"], 0, 0), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_47.png"), ["ppf","fff","fpp","prp"], 0, 1), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_48.png"), ["fff","frp","ppp","prf"], 0, 2), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_49.png"), ["ppp","prp","fff","frp"], 0, 2), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_50.png"), ["ppp","prf","fff","prp"], 0, 2), 3);
    //tiles: all mountain
    addTile(new Tile(loadImage(filePath + "WFT2_32.png"), ["ppp","ppp","mmm","mmm"], 0, 0), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_33.png"), ["mmm","mmp","ppp","pmm"], 0, 1), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_34.png"), ["ppp","ppp","mmm","mmp"], 0, 1), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_35.png"), ["ppp","pmm","mmm","ppp"], 0, 1), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_36.png"), ["mmp","ppp","ppp","pmm"], 0, 1), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_37.png"), ["mmp","ppp","ppp","ppp"], 0, 3), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_38.png"), ["pmm","ppp","ppp","ppp"], 0, 3), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_39.png"), ["mmm","mmp","prp","pmm"], 0, 1), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_40.png"), ["prp","prp","mmm","mmm"], 0, 1), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_41.png"), ["mmp","fff","pmm","mmm"], 0, 1), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_42.png"), ["ppf","fpp","mmm","mmm"], 0, 1), 3);
    addTile(new Tile(loadImage(filePath + "WFT2_46.png"), ["mmm","ppp","ppp","ppp"], 0, 3), 3);

    for(var x=0;x<tiles.length;x++){
        tiles[x].checkConnections(tiles);
    }
}

function loadDetails(filePath){

    //no details
    addDetail(new Detail(loadImage(filePath + "WFT2_00.png"), ["###", "###", "###", "###"], ["###", "###", "###", "###"], "", 0, 8), 0, true);
    //grey road
    addDetail(new Detail(loadImage(filePath + "WFT2_01.png"), ["#g#", "#g#", "#g#", "#g#"], ["#p#", "#p#", "#p#", "#p#"], "fr", 0, 0), 0, true);
    addDetail(new Detail(loadImage(filePath + "WFT2_02.png"), ["###", "#g#", "#g#", "#g#"], ["###", "#p#", "#p#", "#p#"], "fr", 0, 0), 3, true);
    addDetail(new Detail(loadImage(filePath + "WFT2_03.png"), ["###", "#g#", "#g#", "###"], ["###", "#p#", "#p#", "###"], "fr", 0, 1), 3, true);
    addDetail(new Detail(loadImage(filePath + "WFT2_04.png"), ["###", "#g#", "###", "#g#"], ["###", "#p#", "###", "#p#"], "fr", 0, 2), 1, true);
    addDetail(new Detail(loadImage(filePath + "WFT2_05.png"), ["#g#", "###", "#g#", "###"], ["#p#", "###", "#p#", "#r#"], "f", 0, 2), 3, true);
    addDetail(new Detail(loadImage(filePath + "WFT2_29.png"), ["#g#", "###", "###", "###"], ["#p#", "###", "###", "###"], "", 0, 0), 3, true);
    //yellow road
    addDetail(new Detail(loadImage(filePath + "WFT2_06.png"), ["#y#", "#y#", "#y#", "#y#"], ["#p#", "#p#", "#p#", "#p#"], "lr", 0, 0), 0, true);
    addDetail(new Detail(loadImage(filePath + "WFT2_07.png"), ["###", "#y#", "#y#", "#y#"], ["###", "#p#", "#p#", "#p#"], "lr", 0, 0), 3, true);
    addDetail(new Detail(loadImage(filePath + "WFT2_08.png"), ["###", "#y#", "#y#", "###"], ["###", "#p#", "#p#", "###"], "lr", 0, 1), 3, true);
    addDetail(new Detail(loadImage(filePath + "WFT2_09.png"), ["###", "#y#", "###", "#y#"], ["###", "#p#", "###", "#p#"], "lr", 0, 2), 1, true);
    addDetail(new Detail(loadImage(filePath + "WFT2_30.png"), ["#y#", "###", "###", "###"], ["#p#", "###", "###", "###"], "", 0, 0), 3, true);
    addDetail(new Detail(loadImage(filePath + "WFT2_10.png"), ["#y#", "#g#", "#y#", "#g#"], ["#p#", "#p#", "#p#", "#p#"], "fl", 0, 2), 1, true);
    //houses/villages
    addDetail(new Detail(loadImage(filePath + "WFT2_58.png"), ["#y#", "###", "#y#", "###"], ["ppp", "###", "ppp", "###"], "", 0, 1), 3, false);
    addDetail(new Detail(loadImage(filePath + "WFT2_59.png"), ["#g#", "###", "#g#", "###"], ["ppp", "###", "ppp", "###"], "", 0, 1), 1, false);
    addDetail(new Detail(loadImage(filePath + "WFT2_60.png"), ["#y#", "###", "#y#", "###"], ["ppp", "ppp", "ppp", "ppp"], "", 0, 1), 3, false);
    addDetail(new Detail(loadImage(filePath + "WFT2_61.png"), ["#g#", "###", "#g#", "###"], ["ppp", "ppp", "ppp", "ppp"], "", 0, 1), 1, false);

    for(var x=0;x<details.length;x++){
        details[x].checkConnections(details, tiles);
    }
}

function randomizeMap(maxTiles){
    var numTiles = Math.round(random() * maxTiles);

    for(var i=0;i<numTiles;i++){
        var cell = tilemap[Math.round(random() * tilemap.length)];
        collapseCellTile(cell);
    }
}

function nextStep(){
    if(!fullyTiled){
        var result = collapseRandomCellTile();

        if(!result.value){
            if(result.reason != "Map Full") return result;
            //condition needs to be tuned
            fullyTiled = true;
            for(var map=0;map<tilemap.length;map++){
                //push the details into options
                for(var det=0;det<details.length;det++){
                    if(details[det].permittedOn.includes(tilemap[map].tile))
                        tilemap[map].options.push(det);
                }
                //if options remain, the tile is once again collapsable
                if(tilemap[map].Options.length == 1){
                    if(tilemap[map].Options[0] == 0){
                        tilemap[map].setDetail(0);
                        tilemap[map].collapsed = true;
                    }
                }
                if(tilemap[map].Options.length > 0)
                    tilemap[map].collapsed = false;
            }
            //once all tiles know what they are, collapse the ones we know have nothing left
            for(var i=0;i<tilemap.length;i++){
                if(tilemap[i].collapsed){
                    updateNeighbours(tilemap[i]);
                    tilemap[i].detailed = true;
                    console.log("here");
                }

            }
            console.log(tilemap);
        }

        // setDetail(1, 3, 11);

        return result;
    }else if(!fullyDetailed){
        var result = collapseRandomCellDetail();
        if(!result.value && result.reason != "Impossible Details"){
            //condition needs to be tuned
            // fullyDetailed = true;
        }
        return result;
    }else{
        alert("Map Done");
        return {value: false, reason: "Map Complete"};
    }
}

function redraw(canvas) {
    // console.log(canvas.strokeStyle);
    var ctx = canvas.getContext("2d");
    //draw a box
    ctx.strokeStyle = "black";
    ctx.fillStyle = "gray";

    var tileWidth = canvasWidth / tileSize;
    var tileHeight = canvasHeight / tileSize;

    //testing
    // for(var i=0;i<tiles.length;i++){
    //     tilemap[i].setTile(tiles[i]);
    // }

    // tilemap[1].updateEntropy(tiles[0].permittedUp);

    // collapseRandomCell();

    //background
    for(var x=0; x<tileWidth;x++){
        for(var y=0; y<tileHeight; y++){
            var cell = tilemap[y * tileHeight + x];
            if(!cell.tiled || cell.Tile == undefined){
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
                ctx.textAlign = "center";
                // ctx.strokeText(`${x}/${y}`, x * squareSize + squareSize/2, y * squareSize + squareSize/2, squareSize);
            }else{
                ctx.save();
                //move to the point
                ctx.translate(x * tileSize, y  * tileSize);
                //rotate to match the image's rotation
                ctx.rotate(cell.Tile.Rotation * Math.PI / 180);
                //correct for rotation
                switch (cell.Tile.Rotation){
                    case 90: ctx.translate(0, -tileSize); break;
                    case 180:ctx.translate(-tileSize, -tileSize); break;
                    case 270:ctx.translate(-tileSize, 0); break;
                    default: break;
                }
                //draw the image at the destination
                ctx.drawImage(cell.Tile.Image, 0, 0, tileSize, tileSize);
                //reset afterwords
                ctx.restore();
                if(cell.detailed && cell.Detail != undefined){
                    // console.log("ABABA");
                    // console.log(cell);
                    ctx.save();
                    //move to the point
                    ctx.translate(x * tileSize, y  * tileSize);
                    //rotate to match the image's rotation
                    ctx.rotate(cell.Detail.Rotation * Math.PI / 180);
                    //correct for rotation
                    switch (cell.Detail.Rotation){
                        case 90: ctx.translate(0, -tileSize); break;
                        case 180:ctx.translate(-tileSize, -tileSize); break;
                        case 270:ctx.translate(-tileSize, 0); break;
                        default: break;
                    }
                    //draw the image at the destination
                    ctx.drawImage(cell.Detail.Image, 0, 0, tileSize, tileSize);
                    //reset afterwords
                    // ctx.strokeRect(0,0, squareSize, squareSize);
    
                    ctx.restore();
                }
                if(drawGrid)
                    ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
            if(showEntropy)
                ctx.strokeText(`[${cell.Entropy}], (${cell.WeightedEntropy})`, x * tileSize + tileSize/2, y * tileSize + tileSize/2, tileSize);
                
        }
    }
    if(hiliteLastUpdatedCell && lastUpdatedCell != null){
        // console.log("here");
        // console.log(lastUpdatedCell);
        // console.log(ctx);
        ctx.strokeStyle = "red";
        ctx.strokeRect(lastUpdatedCell.posY * tileSize, lastUpdatedCell.posX * tileSize, tileSize, tileSize);
        ctx.strokeStyle = "black";
    }
    //testing image
    // console.log(tiles[3].Image);
}