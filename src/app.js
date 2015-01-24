/**
 * Created by faide on 1/23/2015.
 */

var __PRELOADCANVAS = null;

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();

function findPossibleTiles(player, data) {
    var possible_tiles = [],
        minx, miny, maxx, maxy,
        tile, x, y;

    minx = player.position.x - player.collidable.hw;
    miny = player.position.y - player.collidable.hh;
    maxx = player.position.x + player.collidable.hw;
    maxy = player.position.y + player.collidable.hh;

    x = Math.floor(minx / (map.halfwidth * 2));
    y = Math.floor(miny / (map.halfheight * 2));
    // top left
    tile = data[y][x];

    if (tile > 0) {
        possible_tiles.push({
            pos: {
                x: ((x * 2) + 1) * map.halfwidth,
                y: ((y * 2) + 1) * map.halfheight
            },
            aabb: {
                hw: map.halfwidth,
                hh: map.halfheight
            },
            index: {
                x: x,
                y: y
            },
            tileID: tile
        });
    }

    x = Math.floor(maxx / (map.halfwidth * 2));
    y = Math.floor(miny / (map.halfheight * 2));
    // top right
    tile = data[y][x];

    if (tile > 0) {
        possible_tiles.push({
            pos: {
                x: ((x * 2) + 1) * map.halfwidth,
                y: ((y * 2) + 1) * map.halfheight
            },
            aabb: {
                hw: map.halfwidth,
                hh: map.halfheight
            },
            index: {
                x: x,
                y: y
            },
            tileID: tile
        });
    }

    x = Math.floor(minx / (map.halfwidth * 2));
    y = Math.floor(maxy / (map.halfheight * 2));

    // bottom left
    tile = data[y][x];

    if (tile > 0) {
        possible_tiles.push({
            pos: {
                x: ((x * 2) + 1) * map.halfwidth,
                y: ((y * 2) + 1) * map.halfheight
            },
            aabb: {
                hw: map.halfwidth,
                hh: map.halfheight
            },
            index: {
                x: x,
                y: y
            },
            tileID: tile
        });
    }

    x = Math.floor(maxx / (map.halfwidth * 2));
    y = Math.floor(maxy / (map.halfheight * 2));

    // bottom right
    tile = data[y][x];

    if (tile > 0) {
        possible_tiles.push({
            pos: {
                x: ((x * 2) + 1) * map.halfwidth,
                y: ((y * 2) + 1) * map.halfheight
            },
            aabb: {
                hw: map.halfwidth,
                hh: map.halfheight
            },
            index: {
                x: x,
                y: y
            },
            tileID: tile
        });
    }

    return possible_tiles;
}

function collideBoundingBoxes(pos1, pos2, aabb1, aabb2) {
    var c1 = {
            minx: pos1.x - aabb1.hw,
            maxx: pos1.x + aabb1.hw,
            miny: pos1.y - aabb1.hh,
            maxy: pos1.y + aabb1.hh
        },
        c2 = {
            minx: pos2.x - aabb2.hw,
            maxx: pos2.x + aabb2.hw,
            miny: pos2.y - aabb2.hh,
            maxy: pos2.y + aabb2.hh
        },
        diffx = null,
        diffy = null;
    if (c1.minx < c2.minx && c1.maxx > c2.minx)  {
        // c1 is to the left of c2, and intersecting on the x axis
        diffx = c1.maxx - c2.minx;
    } else if (c1.minx >= c2.minx && c1.minx <= c2.maxx) {
        // c1 is to the right of c2, and intersecting on the x axis
        diffx = c1.minx - c2.maxx;
    }

    if (c1.miny < c2.miny && c1.maxy > c2.miny) {
        // c1 is above c2, and intersecting on the y axis
        diffy = c1.maxy - c2.miny;
    } else if (c1.miny >= c2.miny && c1.miny <= c2.maxy) {
        // c1 is below c2, and intersecting on the y axis
        diffy = c1.miny - c2.maxy;
    }

    if (diffx === null || diffy === null) {
        return false;
    }

    return {
        x: diffx,
        y: diffy
    };

}

function initCanvas(selector) {
    var $canvas = $(selector),
        canvasObj;
    if (!$canvas[0]) {
        console.error('Error loading canvas: no element found matching selector ' + selector);
        return null;
    }
    canvasObj = {
        el:          $canvas,
        ctx:         $canvas[0].getContext('2d'),
        width:       $canvas.width(),
        height:      $canvas.height(),
        strokeQueue: [],
        fillQueue:   [],
        spriteQueue:   []
    };

    //--------------------- defaults
    canvasObj._clearcolor                       = "rgba(0, 0, 0, 1)";
    canvasObj._fillstyle                        = "rgba(255, 255, 255, 1)";
    canvasObj.ctx.webkitImageSmoothingEnabled   = false;
    canvasObj.ctx.mozImageSmoothingEnabled      = false;


    // -------------------- functions
    canvasObj.clear = (function () {
        var oldfill         = this.ctx.fillstyle;
        this.ctx.fillstyle  = this._clearcolor;

        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillstyle  = oldfill;
    }).bind(canvasObj);

    canvasObj.drawRect = (function (x, y, hw, hh, fill) {
        this.fillQueue.push(
            (function (x, y, hw, hh, fill) {
                return function (ctx) {
                    // cache the previous values so they can be restored later
                    ctx.save();

                    ctx.fillStyle = fill;
                    //ctx.translate(x - hw, y - hh);
                    ctx.fillRect(x - hw, y - hh, hw * 2, hh * 2);

                    ctx.restore();
                };
            }(x, y, hw, hh, fill || this._fillstyle))
        );
    }).bind(canvasObj);

    canvasObj.drawSprite = (function (x, y, hw, hh, image, imgx, imgy, imghw, imghh){
        this.spriteQueue.push(
            (function (x, y, hw, hh, image, imgx, imgy, imghw, imghh) {
                return function (ctx) {
                    ctx.save();

                    ctx.drawImage(image, imgx, imgy, imghw * 2, imghh * 2, x - hw, y - hh, hw * 2, hh * 2);

                    ctx.restore();
                }
            }(x, y, hw, hh, image, imgx, imgy, imghw, imghh))
        );
    }).bind(canvasObj);

    canvasObj.drawMap = (function (tilesheet, map) {
        var i, x, y, h, w, tile;
        if (!tilesheet.__loaded) {
            return;
        }

        for (i = 0; i < 3; i += 1) {
            h = map.data[i].length;
            for (y = 0; y < h; y += 1) {
                w = map.data[i][y].length;
                for (x = 0; x < w; x += 1) {
                    if (map.data[i][y][x] !== ' ' && tilesheet.data[map.data[i][y][x]]) {
                        tile = tilesheet.data[map.data[i][y][x]];
                        this.drawSprite(
                            ((x * 2) + 1) * map.halfwidth, ((y * 2) + 1) * map.halfheight,
                            map.halfwidth, map.halfheight,
                            tilesheet.image,
                            tile.x, tile.y,
                            tile.w / 2, tile.h / 2
                        );
                    }
                }
            }
        }
    }).bind(canvasObj);

    canvasObj.drawEntities = (function (tilesheet, entities) {
        var i, l, entity;
        if (!tilesheet.__loaded) {
            return;
        }


        l = entities.length;

        for (i = 0; i < l; i += 1) {
            entity = entities[i];
        }

    }).bind(canvasObj);

    canvasObj.drawPlayer = (function (tilesheet, player) {
        //debugger;

        if (!tilesheet.__loaded) {
            return;
        }

        var playersprite = tilesheet.data[player.renderable._tileID];

        this.drawSprite(
            player.position.x, player.position.y, player.renderable.hw, player.renderable.hh,
            tilesheet.image, playersprite.x, playersprite.y, playersprite.w / 2, playersprite.h / 2
        );
    }).bind(canvasObj);

    canvasObj.render = (function (camera) {
        // stroke queue first, then fill queue
        this.clear();

        this.ctx.save();
        this.ctx.translate(-(camera.x) + (this.width / 2), -(camera.y) + (this.height / 2));

        while (this.strokeQueue.length) {
            this.strokeQueue.shift()(this.ctx);
        }

        while (this.fillQueue.length) {
            this.fillQueue.shift()(this.ctx);
        }

        while (this.spriteQueue.length) {
            this.spriteQueue.shift()(this.ctx);
        }

        this.ctx.restore();

    }).bind(canvasObj);

    return canvasObj;
}

function initCamera(x, y) {
    var camera = {};
    camera.x = x;
    camera.y = y;
    camera.follow = (function (target) {
        camera.x = target.x;
        camera.y = target.y;
    }).bind(camera);

    return camera;
}

function initTilesheet(filepath, thw, thh) {
    var tiles = {
            __loaded: false,
            data: [],
            halfwidth: thw,
            halfheight: thh,
            image: new Image()
        },
        tw = thw * 2,
        th = thh * 2,
        numrows, numcols, x, y;

    tiles.image.onload = function () {
        numrows = tiles.image.width / (tw + 1);
        numcols = tiles.image.height/ (th + 1);

        for (y = 0; y < numrows; y += 1) {
            for (x = 0; x < numcols; x += 1) {
                tiles.data.push({
                    x: (x * 9),
                    y: (y * 9),
                    w: tw,
                    h: th
                });
            }
        }
        tiles.__loaded = true;
    };

    tiles.image.src = filepath;



    return tiles;
}

function initTilemap(ctx, filepath, dict, thw, thh) {
    var image = new Image,
        padZero = function (num, pad) {
            return new Array(pad + 1 - (num + '').length).join('0') + num;
        },
        tilemap = {
            __loaded: false,
            data: [[[]], [[]], [[]]], // 3 layers
            halfwidth: thw,
            halfheight: thh
        };

    image.onload = function () {
        var data, i, l, r, g, b,
            row = -1;
        // instantaneous, should never be seen
        ctx.drawImage(image, 0, 0, image.width, image.height);

        data = ctx.getImageData(0, 0, image.width, image.height).data;
        l = data.length;

        for (i = 0; i < l; i += 4) {
            r = padZero(data[i    ].toString(16), 2);
            g = padZero(data[i + 1].toString(16), 2);
            b = padZero(data[i + 2].toString(16), 2);

            if (i % (image.width * 4) === 0) {
                tilemap.data[0].push([]);
                tilemap.data[1].push([]);
                tilemap.data[2].push([]);
                row += 1;
            }

            if (dict.hasOwnProperty(r)) {
                tilemap.data[0][row].push(dict[r]);
            } else {
                tilemap.data[0][row].push(' ');
            }

            if (dict.hasOwnProperty(g)) {
                tilemap.data[1][row].push(dict[g]);
            } else {
                tilemap.data[1][row].push(' ');
            }

            if (dict.hasOwnProperty(b)) {
                tilemap.data[2][row].push(dict[b]);
            } else {
                tilemap.data[2][row].push(' ');
            }
        }

        tilemap.__loaded = true;
    };

    image.src = filepath;

    return tilemap;
}

function initPlayer(tileNum, hw, hh, x, y, maxv) {
    var player = {};

    player.collidable = {
        hw: hw,
        hh: hh
    };

    player.renderable = {
        _tileID: tileNum,
        hw: hw,
        hh: hh
    };
    player.position   = {
        x: x || 0,
        y: y || 0
    };

    player.velocity   = {
        x: 0,
        y: 0
    };

    player.maxv = maxv || 128;

    // functions

    player.left = (function(keystate) {
        if (keystate) {
            this.velocity.x += -this.maxv;
        } else {
            this.velocity.x -= -this.maxv;
        }
    }).bind(player);

    player.right = (function (keystate) {
        if (keystate) {
            this.velocity.x += this.maxv;
        } else {
            this.velocity.x -= this.maxv;
        }
    }).bind(player);

    player.up = (function (keystate) {
        if (keystate) {
            this.velocity.y += -this.maxv;
        } else {
            this.velocity.y -= -this.maxv;
        }
    }).bind(player);

    player.down = (function (keystate) {
        if (keystate) {
            this.velocity.y += this.maxv;
        } else {
            this.velocity.y -= this.maxv;
        }
    }).bind(player);

    player.update = (function (dt) {
        // clamp maxv

        var velocity_magnitude = Math.sqrt(this.x * this.x + this.y * this.y),
            scale = velocity_magnitude / scale;

        if (scale > 1) {
            this.velocity.x /= scale;
            this.velocity.y /= scale;
        }

        this.position.x += ((this.velocity.x * dt) / 1000) | 0;
        this.position.y += ((this.velocity.y * dt) / 1000) | 0;


    }).bind(player);

    player.collide = (function (map, collidables) {
        if (!map.__loaded) {
            return;
        }
        collidables.walls.collide(this, collidables);
        collidables.triggers.collide(this, collidables);


    }).bind(player);

    return player;
}

function initInput(key_bindings) {
    var input = {
            keys: {
                "w": false,
                "a": false,
                "s": false,
                "d": false,
                "space": false
            },
            bindings: key_bindings
        },
        keymap = {
            87: "w",
            65: "a",
            83: "s",
            68: "d",
            32: "space"
        },
        keydownqueue = [],
        keyupqueue = [];

    window.addEventListener('keydown', function (event) {
        if (keymap[event.keyCode] && input.keys[keymap[event.keyCode]] !== true) {
            input.keys[keymap[event.keyCode]] = true;
            keydownqueue.push(keymap[event.keyCode]);

        }
    });

    window.addEventListener('keyup', function (event) {
        if (keymap[event.keyCode]) {
            input.keys[keymap[event.keyCode]] = false;
            keyupqueue.push(keymap[event.keyCode]);
        }
    });

    input.processInput = (function () {
        var key;
        while (keydownqueue.length) {
            key = keydownqueue.shift();
            if (this.bindings[key]) {
                this.bindings[key](true);
            }
        }

        while (keyupqueue.length) {
            key = keyupqueue.shift();
            if (this.bindings[key]) {
                this.bindings[key](false);
            }
        }
    }).bind(input);

    return input;
}

function initWalls(map, tileIDs) {
    var walls = {},
        loadWalls = function (map, tileIDs) {
            var y, x, w, h, layer;

            walls.wallmap = [[]];

            for (layer = 0; layer < 3; layer += 1) {
                h = map.data[layer].length;
                for (y = 0; y < h; y += 1) {
                    w = map.data[layer][y].length;
                    for (x = 0; x < w; x += 1) {
                        if (tileIDs.indexOf(map.data[layer][y][x]) !== -1) {
                            walls.wallmap[y][x] = 1;
                        } else if (walls.wallmap[y][x] === undefined) {
                            walls.wallmap[y][x] = 0;
                        }
                    }
                    if (walls.wallmap[y + 1] === undefined) {
                        walls.wallmap[y + 1] = [];
                    }
                }
            }

        };

    if (!map.__loaded) {
        window.setTimeout(function () {
            loadWalls(map, tileIDs);
        }, 100);
        console.log('map not loaded yet; waiting 100ms');
    } else {
        loadWalls(map, tileIDs);
    }


    walls.collide = function(player, collidables) {

        // assumes the player collidable is smaller than the tile collidable (a tile cannot be entirely inside the player)
        // at most we test 4 tiles
        var wallmap,
            possible_tiles,
            i, collision_manifold;

        wallmap = collidables.walls.wallmap;

        if (!wallmap || !wallmap.length) {
            return;
        }

        possible_tiles = findPossibleTiles(player, wallmap);


        for (i = 0; i < possible_tiles.length; i += 1) {

            collision_manifold = collideBoundingBoxes(player.position, possible_tiles[i].pos, player.collidable, possible_tiles[i].aabb);

            if (collision_manifold !== false) {
                // collision!
                if (Math.abs(collision_manifold.x) < Math.abs(collision_manifold.y)) {
                    player.position.x -= collision_manifold.x;
                } else {
                    player.position.y -= collision_manifold.y;
                }
                //break;
                // TODO: solve edge collision issues on multi-tile walls
            }
        }
    };

    return walls;
}

function initTriggers(map, t) {
    var triggers = {},

        loadTriggers = function (map, t) {
            var i, l, y, x, w, h;

            triggers.triggermap = [];
            h = map.data[0].length;
            for (y = 0; y < h; y += 1) {
                triggers.triggermap[y] = [];
                w = map.data[0].length;
                for (x = 0; x < w; x += 1) {
                    triggers.triggermap[y][x] = 0;
                }
            }
            l = t.length;

            // set up positions
            for (i = 0; i < l; i += 1) {
                triggers.triggermap[t[i].src.y][t[i].src.x] = i + 1;
                t[i].pos = {
                    x: (t[i].src.x * 2 + 1) * map.halfwidth,
                    y: (t[i].src.y * 2 + 1) * map.halfheight
                };
                t[i].aabb = {
                    hw: map.halfwidth,
                    hh: map.halfheight
                };
                console.log(t[i].src.y, t[i].src.x);
                console.log(triggers.triggermap);
            }

            triggers.data = t;
        };

    if (!map.__loaded) {
        window.setTimeout(function () {
            loadTriggers(map, t);
        }, 100);
        console.log('map not loaded yet; waiting 100ms');
    } else {
        loadTriggers(map, t);
    }

    triggers.collide = function (player, collidables) {

        var triggermap, data, wallmap, possible_tiles, i, collision_manifold, trigger;

        triggermap = collidables.triggers.triggermap;
        data       = collidables.triggers.data;
        wallmap    = collidables.walls.wallmap;

        if (!triggermap || !triggermap.length) {
            return;
        }

        possible_tiles = findPossibleTiles(player, triggermap);

        for (i = 0; i < possible_tiles.length; i += 1) {


            collision_manifold = collideBoundingBoxes(player.position, possible_tiles[i].pos, player.collidable, possible_tiles[i].aabb);

            if (collision_manifold !== false) {
                // collision!

                trigger = data[possible_tiles[i].tileID - 1];

                if (trigger.type === 'lock' && trigger.state !== 1) {
                    trigger.state = 1;
                    map.data[trigger.src.z][trigger.src.y][trigger.src.x] = trigger.sprites[trigger.state];
                    map.data[trigger.target.z][trigger.target.y][trigger.target.x] = "00";
                    wallmap[trigger.target.y][trigger.target.x] = 0;
                }

            }
        }

    };

    return triggers;

}

var tilemap = {
        "ff": 1,
        "01": 0,
        "02": 3,
        "03": 4,
        "04": 5,
        "05": 6
    },
    wall_tiles = [1, 5];


(function ($) {
    var fps = 60,
        frametime = 1000 / fps,
        lastTime = 0,
        currentTime = 0,
        timeSince = 0,
        dt;

    $(document).ready(function () {
        var canvas, camera, map, tiles, input,
            step,
            player,
            entities, triggers, walls, collidables;
        $('#message').text('What do we do now?');

        canvas = initCanvas('#canvas');
        __PRELOADCANVAS = initCanvas('#preload');
        camera = initCamera(canvas.width / 2, canvas.height / 2);


        canvas.clear();


        tilemap = initTilemap(__PRELOADCANVAS.ctx, "img/map.png", tilemap, 32, 32);
        tiles = initTilesheet("img/tiles.png", 4, 4);

        player = initPlayer(2, 16, 16, 32, (2 * 64) + 30, 256);

        input = initInput({
            "w": player.up,
            "a": player.left,
            "s": player.down,
            "d": player.right
        });

        entities = [];
        triggers = [];
        collidables = {};
        walls    = initWalls(tilemap, wall_tiles);
        collidables.walls = walls;


        // --------------------- put map logic here

        // link button->door triggers
        triggers.push({
            type: 'lock',
            src:  {
                y: 5, x: 0, z: 1 // button
            },
            target:{
                y: 1, x: 1, z: 1 // door
            },
            state: 0,
            sprites: [3,4]
        });
        triggers.push({
            type: 'lock',
            src:  {
                y: 8, x: 7, z: 1 // button
            },
            target:{
                y: 6, x: 0, z: 1 // door
            },
            state: 0,
            sprites: [3,4]
        });
        triggers.push({
            type: 'lock',
            src:  {
                y: 7, x: 0, z: 1 // button
            },
            target:{
                y: 8, x: 6, z: 1 // door
            },
            state: 0,
            sprites: [3,4]
        });
        triggers.push({
            type: 'lock',
            src:  {
                y: 7, x: 2, z: 1 // button
            },
            target:{
                y: 8, x: 0, z: 1 // door
            },
            state: 0,
            sprites: [3,4]
        });
        triggers.push({
            type: 'lock',
            src:  {
                y: 9, x: 0, z: 1 // button
            },
            target:{
                y: 6, x: 2, z: 1 // door
            },
            state: 0,
            sprites: [3,4]
        });









        triggers = initTriggers(tilemap, triggers);

        // --------------------------------------------

        collidables.triggers = triggers;

        window.canvas = canvas;
        window.map    = tilemap;
        window.walls  = walls;

        // game loop
        step = function () {
            currentTime = new Date().getTime();
            dt = currentTime - lastTime;
            timeSince += dt;

            if (timeSince >= frametime) {
                // step

                input.processInput();
                player.update(dt);

                player.collide(tilemap, collidables);

                camera.follow(player.position);

                canvas.drawMap(tiles, tilemap);
                canvas.drawEntities(tiles, entities);
                canvas.drawPlayer(tiles, player);
                canvas.render(camera);
                timeSince = timeSince % frametime;
            }

            lastTime = currentTime;

            window.requestAnimFrame(step);
        };

        step();

    });

}(jQuery));