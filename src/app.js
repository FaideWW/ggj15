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
        var x, y, h, w, tile;
        if (!tilesheet.__loaded) {
            return;
        }

        h = map.data.length;
        for (y = 0; y < h; y += 1) {
            w = map.data[y].length;
            for (x = 0; x < w; x += 1) {
                if (map.data[y][x] !== ' ' && tilesheet.data[tilemap.data[y][x]]) {
                    tile = tilesheet.data[tilemap.data[y][x]];
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
    return {
        x: x,
        y: y
    };
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
            data: [[]],
            halfwidth: thw,
            halfheight: thh
        };

    image.onload = function () {
        var data, i, l, r, g, b, hexcolor,
            row = -1;
        // instantaneous, should never be seen
        ctx.drawImage(image, 0, 0, image.width, image.height);

        data = ctx.getImageData(0, 0, image.width, image.height).data;
        l = data.length;

        for (i = 0; i < l; i += 4) {
            r = padZero(data[i    ].toString(16), 2);
            g = padZero(data[i + 1].toString(16), 2);
            b = padZero(data[i + 2].toString(16), 2);

            hexcolor = r + g + b;

            if (i % (image.width * 4) === 0) {
                tilemap.data.push([]);
                row += 1;
            }

            if (dict.hasOwnProperty(hexcolor)) {
                tilemap.data[row].push(dict[hexcolor]);
            } else {
                tilemap.data[row].push(' ');
            }
        }

        tilemap.__loaded = true;
    };

    image.src = filepath;

    return tilemap;
}

function initPlayer(tileNum, hw, hh, x, y) {
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

    // functions

    player.left = (function() {
        this.position.x -= 1;
    }).bind(player);

    player.right = (function () {
        this.position.x += 1;
    }).bind(player);

    player.up = (function () {
        this.position.y -= 1;
    }).bind(player);

    player.down = (function () {
        this.position.y += 1;
    }).bind(player);

    player.collide = (function (map, collidables) {
        // assumes the player collidable is smaller than the tile collidable (a tile cannot be entirely inside the player)
        // at most we test 4 tiles
        var minx, miny, maxx, maxy, tile, x, y, possible_tiles = [],
            i, collision_manifold;

        if (!map.__loaded) {
            return;
        }

        minx = player.position.x - player.collidable.hw;
        miny = player.position.y - player.collidable.hh;
        maxx = player.position.x + player.collidable.hw;
        maxy = player.position.y + player.collidable.hh;

        // top left
        x = Math.floor(minx / (map.halfwidth * 2));
        y = Math.floor(miny / (map.halfheight * 2));
        tile = map.data[y][x];

        if (collidables.indexOf(tile) !== -1) {
            possible_tiles.push({
                pos: {
                    x: ((x * 2) + 1) * map.halfwidth,
                    y: ((y * 2) + 1) * map.halfheight
                },
                aabb: {
                    hw: map.halfwidth,
                    hh: map.halfheight
                }
            });

        }

        // top right
        x = Math.floor(maxx / (map.halfwidth * 2));
        y = Math.floor(miny / (map.halfheight * 2));
        tile = map.data[y][x];

        if (collidables.indexOf(tile) !== -1) {
            possible_tiles.push({
                pos: {
                    x: ((x * 2) + 1) * map.halfwidth,
                    y: ((y * 2) + 1) * map.halfheight
                },
                aabb: {
                    hw: map.halfwidth,
                    hh: map.halfheight
                }
            });
        }

        // bottom left
        x = Math.floor(minx / (map.halfwidth * 2));
        y = Math.floor(maxy / (map.halfheight * 2));
        tile = map.data[y][x];

        if (collidables.indexOf(tile) !== -1) {
            possible_tiles.push({
                pos: {
                    x: ((x * 2) + 1) * map.halfwidth,
                    y: ((y * 2) + 1) * map.halfheight
                },
                aabb: {
                    hw: map.halfwidth,
                    hh: map.halfheight
                }
            });
        }

        // bottom right
        x = Math.floor(maxx / (map.halfwidth * 2));
        y = Math.floor(maxy / (map.halfheight * 2));
        tile = map.data[y][x];

        if (collidables.indexOf(tile) !== -1) {
            possible_tiles.push({
                pos: {
                    x: ((x * 2) + 1) * map.halfwidth,
                    y: ((y * 2) + 1) * map.halfheight
                },
                aabb: {
                    hw: map.halfwidth,
                    hh: map.halfheight
                }
            });
        }

        for (i = 0; i < possible_tiles.length; i += 1) {

            collision_manifold = collideBoundingBoxes(player.position, possible_tiles[i].pos, player.collidable, possible_tiles[i].aabb);

            if (collision_manifold !== false) {
                // collision!
                if (Math.abs(collision_manifold.x) < Math.abs(collision_manifold.y)) {
                    player.position.x -= collision_manifold.x;
                } else {
                    player.position.y -= collision_manifold.y;
                }

                //recollide
                this.collide(map, collidables);
            }
        }



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
        };

    window.addEventListener('keydown', function (event) {
        if (keymap[event.keyCode]) {
            input.keys[keymap[event.keyCode]] = true;
        }
    });

    window.addEventListener('keyup', function (event) {
        if (keymap[event.keyCode]) {
            input.keys[keymap[event.keyCode]] = false;
        }
    });

    input.processInput = (function () {
        var key;
        for (key in this.keys) {
            if (this.keys.hasOwnProperty(key) && this.keys[key] === true && this.bindings[key]) {
                this.bindings[key]();
            }
        }
    }).bind(input);

    return input;
}


var tilemap = {
        "ffffff": 1,
        "000000": 0
    },
    collidable_tiles = [1];


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
            player;
        $('#message').text('What do we do now?');

        canvas = initCanvas('#canvas');
        __PRELOADCANVAS = initCanvas('#preload');
        camera = initCamera(canvas.width / 2, canvas.height / 2);


        canvas.clear();


        tilemap = initTilemap(__PRELOADCANVAS.ctx, "img/map.png", tilemap, 32, 32);
        tiles = initTilesheet("img/tiles.png", 4, 4);

        player = initPlayer(2, 16, 16, 80, 80);

        input = initInput({
            "w": player.up,
            "a": player.left,
            "s": player.down,
            "d": player.right
        });


        window.canvas = canvas;
        window.map    = tilemap;

        // game loop
        step = function () {
            console.log('stepping');
            currentTime = new Date().getTime();
            dt = currentTime - lastTime;
            timeSince += dt;

            if (timeSince >= frametime) {
                // step

                input.processInput();

                player.collide(tilemap, collidable_tiles);

                canvas.drawMap(tiles, tilemap);
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