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

    if (tile || tile.length) {
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

    if (tile || tile.length) {
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

    if (tile || tile.length) {
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

    if (tile || tile.length) {
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
        spriteQueue: [],
        UIQueue:     []
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

                    ctx.drawImage(image, imgx | 0, imgy | 0, (imghw * 2) | 0, (imghh * 2) | 0, (x - hw) | 0, (y - hh) | 0, (hw * 2) | 0, (hh * 2) | 0);

                    ctx.restore();
                }
            }(x, y, hw, hh, image, imgx, imgy, imghw, imghh))
        );
    }).bind(canvasObj);

    canvasObj.drawUI = (function (x, y, hw, hh, image, imgx, imgy, imghw, imghh){
        this.UIQueue.push(
            (function (x, y, hw, hh, image, imgx, imgy, imghw, imghh) {
                return function (ctx) {
                    ctx.save();

                    ctx.drawImage(image, imgx | 0, imgy | 0, (imghw * 2) | 0, (imghh * 2) | 0, (x - hw) | 0, (y - hh) | 0, (hw * 2) | 0, (hh * 2) | 0);

                    ctx.restore();
                }
            }(x, y, hw, hh, image, imgx, imgy, imghw, imghh))
        );
    }).bind(canvasObj);

    canvasObj.drawMap = (function (tilesheet, map, camera) {
        var minx, maxx, miny, maxy, i, x, y, h, w, tile, tilex, tiley;
        if (!tilesheet.__loaded) {
            return;
        }

        minx = camera.x - this.width  / 2 - (map.halfwidth);
        maxx = camera.x + this.width  / 2 + (map.halfwidth);
        miny = camera.y - this.height / 2 - (map.halfheight);
        maxy = camera.y + this.height / 2 + (map.halfheight);

        for (i = 0; i < 2; i += 1) {
            h = map.data[i].length;
            for (y = 0; y < h; y += 1) {
                w = map.data[i][y].length;
                for (x = 0; x < w; x += 1) {
                    if (map.data[i][y][x] !== ' ' && tilesheet.data[map.data[i][y][x]]) {
                        tile = tilesheet.data[map.data[i][y][x]];
                        tilex =  ((x * 2) + 1) * map.halfwidth;
                        tiley =  ((y * 2) + 1) * map.halfheight;
                        if (tilex > minx && tilex < maxx && tiley > miny && tiley < maxy) {
                            this.drawSprite(
                                tilex, tiley,
                                map.halfwidth, map.halfheight,
                                tilesheet.image,
                                tile.x, tile.y,
                                tile.w / 2, tile.h / 2
                            );
                        }
                    }
                }
            }
        }
    }).bind(canvasObj);


    canvasObj.drawForeground = (function (tilesheet, map, camera) {
        var minx, maxx, miny, maxy, i, x, y, h, w, tile, tilex, tiley;
        if (!tilesheet.__loaded) {
            return;
        }

        minx = camera.x - this.width  / 2 - (map.halfwidth);
        maxx = camera.x + this.width  / 2 + (map.halfwidth);
        miny = camera.y - this.height / 2 - (map.halfheight);
        maxy = camera.y + this.height / 2 + (map.halfheight);

        for (i = 2; i < 3; i += 1) {
            h = map.data[i].length;
            for (y = 0; y < h; y += 1) {
                w = map.data[i][y].length;
                for (x = 0; x < w; x += 1) {
                    if (map.data[i][y][x] !== ' ' && tilesheet.data[map.data[i][y][x]]) {
                        tile = tilesheet.data[map.data[i][y][x]];
                        tilex =  ((x * 2) + 1) * map.halfwidth;
                        tiley =  ((y * 2) + 1) * map.halfheight;
                        if (tilex > minx && tilex < maxx && tiley > miny && tiley < maxy) {
                            this.drawSprite(
                                tilex, tiley,
                                map.halfwidth, map.halfheight,
                                tilesheet.image,
                                tile.x, tile.y,
                                tile.w / 2, tile.h / 2
                            );
                        }
                    }
                }
            }
        }
    }).bind(canvasObj);

    canvasObj.drawEnemies = (function (tilesheet, enemies) {
        var i, l, enemy, enemysprite;
        if (!tilesheet.__loaded || !enemies.data) {
            return;
        }

        l = enemies.data.length;

        for (i = 0; i < l; i += 1) {
            enemy = enemies.data[i];

            enemysprite = tilesheet.data[enemy.tileID];
            if (enemysprite === undefined) {
                console.log(enemy);
                continue;
            }

            this.drawSprite(
                enemy.position.x, enemy.position.y, enemy.renderable.hw, enemy.renderable.hh,
                tilesheet.image, enemysprite.x, enemysprite.y, enemysprite.w / 2, enemysprite.h / 2
            );
        }

    }).bind(canvasObj);

    canvasObj.drawPlayer = (function (tilesheet, player) {
        var weaponpos;

        if (!tilesheet.__loaded) {
            return;
        }

        var playersprite = tilesheet.data[player.renderable._tileID],
            weaponsprite;

        this.drawSprite(
            player.position.x, player.position.y, player.renderable.hw, player.renderable.hh,
            tilesheet.image, playersprite.x, playersprite.y, playersprite.w / 2, playersprite.h / 2
        );

        // draw weapon if one is equipped
        if (player.weapon && player.attacking) {
            weaponsprite = tilesheet.data[player.weapon.renderable.tileID];

            if (player.facing === "right") {
                weaponpos = {
                    x: player.position.x + player.renderable.hw + player.weapon.position.x,
                    y: player.position.y + player.weapon.position.y
                };
            } else if (player.facing === "left") {
                weaponpos = {
                    x: player.position.x - player.renderable.hw + player.weapon.position.x,
                    y: player.position.y + player.weapon.position.y
                };
            } else if (player.facing === "up") {
                weaponpos = {
                    x: player.position.x + player.weapon.position.x,
                    y: player.position.y - player.renderable.hh + player.weapon.position.y
                };
            } else if (player.facing === "down") {
                weaponpos = {
                    x: player.position.x + player.weapon.position.x,
                    y: player.position.y + player.renderable.hh + player.weapon.position.y
                };
            }
            this.drawSprite(
                weaponpos.x, weaponpos.y, player.weapon.renderable.hw, player.weapon.renderable.hh,
                tilesheet.image, weaponsprite.x, weaponsprite.y, weaponsprite.w / 2, weaponsprite.h / 2
            );
        }


    }).bind(canvasObj);


    canvasObj.drawConsole = (function (tilesheet, cnsl) {
        var i, j, l, m, msg, letter, x, y;
        l = cnsl.log.length;
        x = cnsl.padding.x;
        y = cnsl.padding.y;

        for (i = 0; i < l; i += 1) {
            msg = cnsl.log[i].msg;
            m = msg.length;
            for (j = 0; j < m; j += 1) {
                letter = tilesheet.data[msg[j]];
                this.drawUI(
                  x, y, cnsl.fontSize / 2, cnsl.fontSize / 2,
                    tilesheet.image, letter.x, letter.y, letter.w / 2, letter.h / 2
                );
                x += cnsl.fontSize;
            }
            x = cnsl.padding.x;
            y += cnsl.fontSize * 2;
        }

    });

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

        while (this.UIQueue.length) {
            this.UIQueue.shift()(this.ctx);
        }

    }).bind(canvasObj);

    return canvasObj;
}

function initCamera(x, y) {
    var camera = {};
    camera.x = x;
    camera.y = y;
    camera.follow = (function (target, bounds) {
        camera.x = Math.min(Math.max(target.x, bounds.minx), bounds.maxx);
        camera.y = Math.min(Math.max(target.y, bounds.miny), bounds.maxy);
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
        numcols = tiles.image.width / (tw + 1);
        numrows = tiles.image.height/ (th + 1);

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

function initPlayer(spritemap, hw, hh, pos, maxv, animation_fps) {
    var player = {};

    player.facing = "down";
    player._spritemap = spritemap;
    player._currentframe = 0;
    player.frametime = 1000 / (animation_fps || 2);
    player._timesince = 0;
    player.moving = {
        x: false,
        y: false
    };
    player._motionstate = "idle";
    player.attacking = false;
    player.weapon = null;
    player.hp     = 10;
    player.alive  = true;

    player.collidable = {
        hw: hw,
        hh: hh
    };

    player.renderable = {
        _tileID: player._spritemap[player._motionstate][player.facing][player._currentframe],
        hw: hw,
        hh: hh
    };
    player.position   = {
        x: pos.x || 0,
        y: pos.y || 0
    };

    player.velocity   = {
        x: 0,
        y: 0
    };

    // tangential velocity that overrides movement
    player.knockback  = {
        x: 0,
        y: 0
    };

    player._invulnerable = 0;


    player.maxv = maxv || 128;

    // functions

    player.equip = (function (weapon) {
        this.weapon = weapon;
    }).bind(player);

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

    player.attack = (function (keystate) {
        if (keystate) {
            if (!this.attacking && this.weapon) {
                this.attacking = true;
                this.weapon.activate();
            }
        }
    }).bind(player);

    player.changeDirection = (function (dir) {
        // don't change directions mid-attack!
        if (!this.attacking) {
            this.facing = dir;
            this.renderable._tileID = this._spritemap[this._motionstate][this.facing][this._currentframe];

            if (this.weapon) {
                this.weapon.changeDirection(dir);
            }

        }
    }).bind(player);

    player.update = (function (dt) {
        // clamp maxv

        if (!this.alive) {
            return;
        }

        var velocity_magnitude = Math.sqrt(this.x * this.x + this.y * this.y),
            scale = velocity_magnitude / scale,
            attack_done;

        if (scale > 1) {
            this.velocity.x /= scale;
            this.velocity.y /= scale;
        }

        if (this.weapon) {
            attack_done = this.weapon.update(dt);
            if (attack_done) {
                this.attacking = false;
            }
        }

        this._invulnerable = Math.max(0, this._invulnerable - dt);

        if (this.knockback.x === 0 && this.knockback.y === 0) {
            this.position.x += ((this.velocity.x * dt) / 1000) | 0;
            this.position.y += ((this.velocity.y * dt) / 1000) | 0;


            if (this.velocity.y < 0) {
                this.changeDirection("up");
                this.moving.y = true;
            } else if (this.velocity.y > 0) {
                this.changeDirection("down");
                this.moving.y = true;
            } else {
                this.moving.y = false;
            }

            if (this.velocity.x < 0) {
                this.changeDirection("left");
                this.moving.x = true;
            } else if (this.velocity.x > 0) {
                this.changeDirection("right");
                this.moving.x = true;
            } else {
                this.moving.x = false;
            }

            this._motionstate = (this.moving.x || this.moving.y) ? "motion" : "idle";


        } else {
            this.position.x += ((this.knockback.x * dt) / 1000) | 0;
            this.position.y += ((this.knockback.y * dt) / 1000) | 0;

            this.knockback.x *= 0.8;
            this.knockback.y *= 0.8;

            if (Math.abs(this.knockback.x) < 10) {
                this.knockback.x = 0;
            }

            if (Math.abs(this.knockback.y) < 10) {
                this.knockback.y = 0;
            }
        }

        this._timesince += dt;
        if (this._timesince > this.frametime) {
            this._timesince = this._timesince % this.frametime;
            this._currentframe = (this._currentframe + 1) % this._spritemap[this._motionstate][this.facing].length;

        }

        this.renderable._tileID = this._spritemap[this._motionstate][this.facing][this._currentframe];


    }).bind(player);

    player.hit = (function (enemy, collision_manifold) {
        if (this._invulnerable === 0) {
            this.hp -= enemy.damage || 1;
            if (this.hp <= 0) {
                this.die();
                return;
            }
            // received hit from enemy
            if (Math.abs(collision_manifold.x) < Math.abs(collision_manifold.y)) {
                player.knockback.x = collision_manifold.x / Math.abs(collision_manifold.x) * 500;
                if (collision_manifold.x < 0) {
                    this.changeDirection("right");
                } else {
                    this.changeDirection("left");
                }
            } else {
                player.knockback.y = collision_manifold.y / Math.abs(collision_manifold.y) * 500;
                if (collision_manifold.y < 0) {
                    this.changeDirection("down");
                } else {
                    this.changeDirection("up");
                }
            }
            this._invulnerable = 500;
        }

    });

    player.collide = (function (map, collidables) {
        if (!map.__loaded) {
            return;
        }
        collidables.walls.collide(this, collidables, (function (collision_manifold) {
            if (Math.abs(collision_manifold.x) < Math.abs(collision_manifold.y)) {
                this.position.x -= collision_manifold.x;
            } else {
                this.position.y -= collision_manifold.y;
            }
        }).bind(this));
        collidables.triggers.collide(this, collidables);
        collidables.enemies.collide(this, collidables);


    }).bind(player);

    player.die = (function () {
        this.alive = false;
        this.renderable._tileID = this._spritemap.dead;
        cout.print("You were killed.", true);
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

            for (layer = 0; layer < 2; layer += 1) { // ignore top-layer walls (invisible walls)
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


    walls.collide = function(player, collidables, callback) {

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
                callback(collision_manifold);
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
                if (!triggers.triggermap[t[i].src.y][t[i].src.x]) {
                    triggers.triggermap[t[i].src.y][t[i].src.x] = [];
                }
                triggers.triggermap[t[i].src.y][t[i].src.x].push(i + 1);
                t[i].pos = {
                    x: (t[i].src.x * 2 + 1) * map.halfwidth,
                    y: (t[i].src.y * 2 + 1) * map.halfheight
                };
                t[i].aabb = {
                    hw: map.halfwidth,
                    hh: map.halfheight
                };
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

        var triggermap, data, wallmap, possible_tiles, i, collision_manifold, trigger, j;

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

                for (j = 0; j < possible_tiles[i].tileID.length; j += 1) {
                    trigger = data[possible_tiles[i].tileID[j] - 1];

                    if (trigger.type === 'lock' && trigger.state !== 1) {
                        trigger.state = 1;
                        map.data[trigger.src.z][trigger.src.y][trigger.src.x] = trigger.sprites[trigger.state];
                        map.data[trigger.target.z][trigger.target.y][trigger.target.x] = "00";
                        wallmap[trigger.target.y][trigger.target.x] = 0;
                        trigger.action();
                    } else if (trigger.type === 'goal' && trigger.state !== 1) {
                        trigger.state = 1;
                        map.data[trigger.src.z][trigger.src.y][trigger.src.x] = "00";
                        trigger.action();
                    }
                }

            }
        }

    };

    return triggers;
}

function initEnemies(map, e) {
    var enemies = {},
        loadEnemies = function (map, e) {
            var i, l;
            enemies.data = e;
            l = e.length;

            for (i = 0; i < l; i += 1) {
                enemies.data[i].tileID = enemies.data[i].sprite[enemies.data[i].status][enemies.data[i].motionstate][0];
                enemies.data[i].velocity = {
                    x: 0,
                    y: 0
                };
                enemies.data[i].knockback = {
                    x: 0,
                    y: 0
                };
                enemies.data[i].collidedirections = {
                    x: false,
                    y: false
                };
                enemies.data[i]._invulnerable = 0;
                enemies.data[i].maxv = enemies.data[i].maxv || 64;
                enemies.data[i].renderable = {
                    frametime: 1000 / (e[i].fps || 10),
                    hw:  e[i].size.hw,
                    hh:  e[i].size.hh,
                    _timesince: 0,
                    _currentframe: 0
                };

                enemies.data[i].hit = (function (damage, collision_manifold) {
                    console.log(this._invulnerable);
                    if (this._invulnerable === 0) {
                        this.hp -= damage;
                        this._invulnerable = 100;
                        console.log(this.hp);
                        if (this.hp <= 0) {
                            this.kill();
                        }
                        // received hit from enemy
                        if (Math.abs(collision_manifold.x) < Math.abs(collision_manifold.y)) {
                            this.knockback.x = collision_manifold.x / Math.abs(collision_manifold.x) * 200;
                        } else {
                            this.knockback.y = collision_manifold.y / Math.abs(collision_manifold.y) * 200;
                        }
                        if (this.onHit) {
                            this.onHit.call(this, enemies);
                        }
                    }
                }).bind(enemies.data[i]);

                enemies.data[i].kill = (function () {
                    var index = enemies.data.indexOf(this);
                    enemies.data.splice(index, 1);
                }).bind(enemies.data[i]);
            }
        };

    if (!map.__loaded) {
        window.setTimeout(function () {
            loadEnemies(map, e);
        }, 100);
        console.log('map not loaded yet; waiting 100ms');
    } else {
        loadEnemies(map, e);
    }


    enemies.update = (function (dt, player) {
        var i, l, enemy, velocity_mag;

        if (!this.data) {
            return;
        }


        l = this.data.length;
        for (i = 0; i < l; i += 1) {
            enemy = this.data[i];

            // animation update
            enemy._invulnerable = Math.max(0, enemy._invulnerable - dt);

            enemy.renderable._timesince += dt;
            if (enemy.renderable._timesince > enemy.renderable.frametime) {
                enemy.renderable._timesince = enemy.renderable._timesince % enemy.renderable.frametime;
                enemy.renderable._currentframe = (enemy.renderable._currentframe + 1) % enemy.sprite[enemy.status][enemies.data[i].motionstate].length;
                enemy.tileID = enemy.sprite[enemy.status][enemies.data[i].motionstate][enemy.renderable._currentframe];
            }


            // follow logic update

            if (enemy.behavior === 'follow') {
                if (!player.alive) {
                    enemy.behavior = 'patrol';
                    enemy.status   = 'NEUTRAL';
                    enemy.maxv    /= 2;
                }
                // determine proximity to player
                 enemy.velocity.x = (player.position.x - enemy.position.x);
                enemy.velocity.y = (player.position.y - enemy.position.y);

                velocity_mag = Math.sqrt((enemy.velocity.x * enemy.velocity.x) + (enemy.velocity.y * enemy.velocity.y));
                if (velocity_mag > 0) {
                    enemy.velocity.x /= velocity_mag;
                    enemy.velocity.y /= velocity_mag;

                    enemy.velocity.x *= enemy.maxv;
                    enemy.velocity.y *= enemy.maxv;
                }



            } else if (enemy.behavior === 'patrol') {
                if (enemy.velocity.x === 0 && enemy.velocity.y === 0) {
                    enemy.velocity.x = Math.random() * enemy.maxv;
                    enemy.velocity.y = Math.random() * enemy.maxv;
                } else {
                    enemy.motionstate = "moving";
                }
            }

            if (enemy.knockback.x === 0 && enemy.knockback.y === 0) {
                // physics update
                enemy.position.x += enemy.velocity.x * dt / 1000;
                enemy.position.y += enemy.velocity.y * dt / 1000;
            } else {
                enemy.position.x += ((enemy.knockback.x * dt) / 1000) | 0;
                enemy.position.y += ((enemy.knockback.y * dt) / 1000) | 0;

                enemy.knockback.x *= 0.8;
                enemy.knockback.y *= 0.8;

                if (Math.abs(enemy.knockback.x) < 10) {
                    enemy.knockback.x = 0;
                }

                if (Math.abs(enemy.knockback.y) < 10) {
                    enemy.knockback.y = 0;
                }
            }


        }
    }).bind(enemies);

    enemies.collide = (function (player, collidables) {
        var i, l, enemy, collision, weaponpos;

        if (!this.data) {
            return;
        }

        l = this.data.length;

        for (i = 0; i < l; i += 1) {
            enemy = this.data[i];

            if (!enemy) { continue; }


            // player collision
            collision = collideBoundingBoxes(enemy.position, player.position, enemy.size, player.collidable);

            if (collision !== false) {
                if (enemy.status === "PROVOKED") {
                    player.hit(enemy, collision);
                    //console.log('lose!');
                } else if (enemy.status === "NEUTRAL" && player.alive) {
                    if (Math.abs(collision.x) < Math.abs(collision.y)) {
                        player.position.x += (collision.x | 0);
                    } else {
                        player.position.y += (collision.y | 0);
                    }
                }

            }

            if (player.weapon && player.attacking) {
                if (player.facing === "right") {
                    weaponpos = {
                        x: player.position.x + player.renderable.hw + player.weapon.position.x,
                        y: player.position.y + player.weapon.position.y
                    };
                } else if (player.facing === "left") {
                    weaponpos = {
                        x: player.position.x - player.renderable.hw + player.weapon.position.x,
                        y: player.position.y + player.weapon.position.y
                    };
                } else if (player.facing === "up") {
                    weaponpos = {
                        x: player.position.x + player.weapon.position.x,
                        y: player.position.y - player.renderable.hh + player.weapon.position.y
                    };
                } else if (player.facing === "down") {
                    weaponpos = {
                        x: player.position.x + player.weapon.position.x,
                        y: player.position.y + player.renderable.hh + player.weapon.position.y
                    };
                }
                collision = collideBoundingBoxes(weaponpos, enemy.position, player.weapon.collidable, enemy.size);

                if (collision !== false) {
                    enemy.hit(player.weapon.damage, collision);
                    if (enemy.onHit) {
                        enemy.onHit(enemies);
                    }
                }
            }

            enemy.collidable = enemy.size;

            // also collide with walls
            collidables.walls.collide(enemy, collidables, (function (enemy) {
                return function (collision_manifold) {
                    if (collision_manifold.x < 0) {
                        //debugger;
                    }
                    if (Math.abs(collision_manifold.x) < Math.abs(collision_manifold.y) && !enemy.collidedirections.x) {
                        enemy.position.x -= collision_manifold.x;
                        enemy.velocity.x *= -1;
                        enemy.collidedirections.x = true;
                    } else if (Math.abs(collision_manifold.x) >= Math.abs(collision_manifold.y) && !enemy.collidedirections.y) {
                        enemy.position.y -= collision_manifold.y;
                        enemy.velocity.y *= -1;
                        enemy.collidedirections.y = true;
                    }
                }
            })(enemy));

            enemy.collidedirections.x = false;
            enemy.collidedirections.y = false;

        }


    }).bind(enemies);

    return enemies;
}

function initWeapon(name, animation, renderable, hitbox, speed, damage, offset, currentDir) {
    var weapon = {
        id: name,
        frames: animation,
        hitbox: hitbox,
        damage: damage,
        frametime: speed,
        offset: offset,
        dir: currentDir,

        _currentFrame: 0,
        _currentTime: 0,
        active: false
    };

    weapon.renderable = {
        tileID: weapon.frames[weapon.dir][weapon._currentFrame],
        hw:     renderable.hw,
        hh:     renderable.hh
    };

    weapon.collidable = {
        hw: weapon.hitbox[weapon.dir][weapon._currentFrame].hw,
        hh: weapon.hitbox[weapon.dir][weapon._currentFrame].hh
    };

    weapon.position = weapon.offset[weapon.dir][weapon._currentFrame];

    weapon.changeDirection = (function (dir) {
        this.dir = dir;
    }).bind(weapon);

    weapon.activate = (function () {
        if (!this.active) {
            this.renderable.tileID = this.frames[this.dir][this._currentFrame];

            this.collidable = {
                hw: this.hitbox[this.dir][this._currentFrame].hw,
                hh: this.hitbox[this.dir][this._currentFrame].hh
            };

            this.position = this.offset[this.dir][this._currentFrame];
            this.active = true;
        }
    }).bind(weapon);

    weapon.deactivate = (function () {
        if (this.active) {
            this.active = false;
            this._currentFrame = 0;
            this._currentTime = 0;
        }
    }).bind(weapon);

    weapon.update = (function (dt) { //returns true if attack animation is complete
        if (this.active) {
            this._currentTime += dt;
            if (this._currentTime > this.frametime) {
                this._currentFrame += 1;

                if (this._currentFrame === this.frames[this.dir].length) {
                    // attack animation is over; deactivate the weapon
                    this.deactivate();
                    return true;
                }


                this._currentTime = this._currentTime % this.frametime;

                this.renderable.tileID = this.frames[this.dir][this._currentFrame];

                this.collidable.hw = this.hitbox[this.dir][this._currentFrame].hw;
                this.collidable.hh = this.hitbox[this.dir][this._currentFrame].hh;

                this.position = this.offset[this.dir][this._currentFrame];
            }
        }
    }).bind(weapon);

    return weapon;
}

function initConsole(alphabet) {
    var cnsl = {};

    cnsl.keymap = alphabet;
    cnsl.log = [];
    cnsl.padding = {
        x: 16,
        y: 16
    };
    cnsl.fontSize = 16;

    cnsl.translate = (function (msg) {
        var i, l, sprites = [];
        l = msg.length;
        for (i = 0; i < l; i += 1) {
            if (this.keymap.hasOwnProperty(msg[i])) {
                sprites.push(this.keymap[msg[i]]);
            } else {
                sprites.push(this.keymap["?"]);
            }
        }
        return sprites;
    }).bind(cnsl);

    cnsl.print = (function (message, permanent) {
        this.log.push({
            time: (permanent) ? Infinity : 5000,
            msg:  this.translate(message)
        });
    }).bind(cnsl);

    cnsl.update = (function (dt) {
        var i, l;
        l = this.log.length;
        for (i = 0; i < l; i += 1) {
            if (!this.log[i]) { continue; }
            this.log[i].time -= dt;
            if (this.log[i].time <= 0) {
                this.log.splice(i,1);
            }
        }
    }).bind(cnsl);

    return cnsl;
}

var tilemap = {
        "ff": 1, // rock
        "01": 0, // grass
        "02": 3, // button (unpressed)
        "03": 4, // button (pressed)
        "04": 5, // door
        "05": 6, // coin
        "06": 7, // dagger (dropped)
        "07": 2, // tile
        "fe": 38, // wall
        "cc": 45, // bush left
        "cd": 46, //  bush right,
        "08": 47, // robot controller,
        "aa": 48  // water
    },
    wall_tiles = [1, 5, 38],
    cout;


(function ($) {
    var fps = 60,
        frametime = 1000 / fps,
        lastTime = 0,
        currentTime = 0,
        timeSince = 0,
        dt, tile,
        robotID = 0,
        createRobot = function (y, x, behavior) {
            return {
                id: robotID++,
                type: "robotguard",
                sprite: {
                    "NEUTRAL":  {
                        "idle": [54, 55],
                        "moving": [56,57]
                    },
                    "PROVOKED": {
                        "idle": [63, 64],
                        "moving": [65, 66]
                    },
                    "FRIENDLY": {
                        "idle": [72, 73],
                        "moving": [74,75]
                    }
                },
                status: "NEUTRAL",
                behavior: behavior || "patrol",
                motionstate: "idle",
                maxv: 128,
                fps: 3,
                hp: 20,
                damage: 5,
                position: tile(y, x),
                size: {
                    hw: 24,
                    hh: 24
                },
                onHit: function (enemies) {
                    var i, l;
                    l = enemies.data.length;
                    if (this.status === "FRIENDLY") {
                        return;
                    }
                    for (i = 0; i < l; i += 1) {
                        if (enemies.data[i].type === 'robotguard') {
                            enemies.data[i].status = "PROVOKED";
                            enemies.data[i].behavior = "follow";
                            enemies.data[i].maxv = 240;
                        }
                    }
                }
            };
        };

    $(document).ready(function () {
        var canvas, camera, map, tiles, input,
            step,
            player, dagger,
            enemies, triggers, walls, collidables,
            map_height, map_width, camera_bounds;
        $('#message').text('What do we do now?');

        canvas = initCanvas('#canvas');
        __PRELOADCANVAS = initCanvas('#preload');
        camera = initCamera(canvas.width / 2, canvas.height / 2);


        canvas.clear();


        tilemap = initTilemap(__PRELOADCANVAS.ctx, "img/map.png", tilemap, 32, 32);

        tiles = initTilesheet("img/tiles.png", 4, 4);

        tile = function (y, x) {
            // returns worldspace coordinates for tilemap coordinates (the center of the tile)
            return {
                x: ((x * 2) + 1) * tilemap.halfwidth,
                y: ((y * 2) + 1) * tilemap.halfheight
            }
        };


        player = initPlayer({
            "motion": {
                "down":  [9,  18, 9,  18, 9,  18],
                "left":  [10, 19, 10, 19, 10, 19],
                "up":    [11, 20, 11, 20, 11, 20],
                "right": [12, 21, 12, 21, 12, 21]
            },
            "idle": {
                "down":  [9,  9,  9,  9,  9,  27],
                "left":  [10, 10, 10, 10, 10, 28],
                "up":    [11, 11, 11, 11, 11, 29],
                "right": [12, 12, 12, 12, 12, 30]
            },
            "dead": 39



        }, 16, 16, tile(50, 50), 256, 5);


        input = initInput({
            "w": player.up,
            "a": player.left,
            "s": player.down,
            "d": player.right,
            "space": player.attack
        });

        cout = initConsole({
            "a": 126,
            "A": 126,
            "b": 127,
            "B": 127,
            "c": 128,
            "C": 128,
            "d": 129,
            "D": 129,
            "e": 130,
            "E": 130,
            "f": 131,
            "F": 131,
            "g": 132,
            "G": 132,
            "h": 133,
            "H": 133,
            "i": 134,
            "I": 134,
            "j": 135,
            "J": 135,
            "k": 136,
            "K": 136,
            "l": 137,
            "L": 137,
            "m": 138,
            "M": 138,
            "n": 139,
            "N": 139,
            "o": 140,
            "O": 140,
            "p": 141,
            "P": 141,
            "q": 142,
            "Q": 142,
            "r": 143,
            "R": 143,
            "s": 144,
            "S": 144,
            "t": 145,
            "T": 145,
            "u": 146,
            "U": 146,
            "v": 147,
            "V": 147,
            "w": 148,
            "W": 148,
            "x": 149,
            "X": 149,
            "y": 150,
            "Y": 150,
            "z": 151,
            "Z": 151,
            ".": 152,
            "!": 153,
            "?": 154,
            " ": 155
        });

        enemies = [];
        triggers = [];
        collidables = {};
        walls    = initWalls(tilemap, wall_tiles);
        collidables.walls = walls;


        // --------------------- put map logic here

        // link button->door triggers
        triggers.push({
            type: 'lock',
            src:  {
                y: 40, x: 44, z: 1 // button
            },
            target:{
                y: 40, x: 52, z: 1 // door
            },
            state: 0,
            sprites: [3,4],
            action: function () {
                cout.print('A locked door has opened.');
            }
        });

        triggers.push({
            type: 'lock',
            src: {
                y: 44, x: 55, z: 1 // button
            },
            target: {
                y: 45, x: 47, z: 1 // door
            },
            state: 0,
            sprites: [3,4],
            action: function () {
                cout.print('A locked door has opened.');
            }
        });

        // goal/win state trigger


        triggers.push({
            type: 'goal',
            src: {
                y: 40, x: 44, z: 2 // dagger
            },
            state: 0,
            action: function () {
                player.equip(dagger);
                cout.print('Picked up dagger.');
            }
        });

        triggers.push({
            type: 'goal',
            src: {
                y: 60, x: 54, z: 1 // robot controller
            },
            state: 0,
            action: function () {
                var i, l;
                cout.print('Found a robot pacifier.');

                l = enemies.data.length;
                for (i = 0; i < l; i += 1) {
                    if (enemies.data[i].type === 'robotguard') {
                        enemies.data[i].status = "FRIENDLY";
                    }
                }
            }
        });



        // enemies
        //enemies.push({
        //    sprite: {
        //        "default": {
        //            "idle": [36,37]
        //        }
        //    },d
        //    status: "default",
        //    behavior: "follow",
        //    motionstate: "idle",
        //    fps: 10,
        //    hp:  10,
        //    position: tile(1,5),
        //    size: {
        //        hw: 16,
        //        hh: 16
        //    }
        //});

        enemies.push(createRobot(41, 54));
        enemies.push(createRobot(35, 45));
        enemies.push(createRobot(35, 54));
        enemies.push(createRobot(31, 48, "guard"));
        enemies.push(createRobot(31, 49, "guard"));

        console.log(enemies);

        // weapons
        dagger = initWeapon( "dagger",
            {
                "right": [13, 14, 15, 16],
                "up": [22, 23, 24, 25],
                "left": [31, 32, 33, 34],
                "down": [40, 41, 42, 43]
            },
            {
                hw: 16,
                hh: 16
            },
            {
                "right": [
                    { hw: 2, hh: 2 },
                    { hw: 4, hh: 4 },
                    { hw: 4, hh: 4 },
                    { hw: 2, hh: 2 }
                ],
                "up": [
                    { hw: 2, hh: 2 },
                    { hw: 4, hh: 4 },
                    { hw: 4, hh: 4 },
                    { hw: 2, hh: 2 }
                ],
                "left": [
                    { hw: 2, hh: 2 },
                    { hw: 4, hh: 4 },
                    { hw: 4, hh: 4 },
                    { hw: 2, hh: 2 }
                ],
                "down": [
                    { hw: 2, hh: 2 },
                    { hw: 4, hh: 4 },
                    { hw: 4, hh: 4 },
                    { hw: 2, hh: 2 }
                ]
            },
            30,
            1,
            {       // offset from the side that the weapon is coming from
                "right":
                    [
                        { x: 16, y: 0 },
                        { x: 16, y: 0 },
                        { x: 16, y: 0 },
                        { x: 16, y: 0 }
                    ],
                "up":
                    [
                        { x: 0, y: -16 },
                        { x: 0, y: -16 },
                        { x: 0, y: -16 },
                        { x: 0, y: -16 }
                    ],
                "left":
                    [
                        { x: -16, y: 0 },
                        { x: -16, y: 0 },
                        { x: -16, y: 0 },
                        { x: -16, y: 0 }
                    ],
                "down":
                    [
                        { x: 0, y: 16 },
                        { x: 0, y: 16 },
                        { x: 0, y: 16 },
                        { x: 0, y: 16 }
                    ]
            },
            "down"
        );

        //player.equip(dagger);


        triggers = initTriggers(tilemap, triggers);
        enemies  = initEnemies(tilemap, enemies);

        // --------------------------------------------

        collidables.triggers = triggers;
        collidables.enemies  = enemies;

        window.canvas = canvas;
        window.map    = tilemap;
        window.walls  = walls;
        window.enemies = enemies;

        // game loop
        step = function () {
            currentTime = new Date().getTime();
            dt = currentTime - lastTime;
            timeSince += dt;

            if (timeSince >= frametime) {
                // step

                input.processInput();
                player.update(dt);
                enemies.update(dt, player);
                cout.update(dt);

                player.collide(tilemap, collidables);

                $('#pixelpos').text("<" + player.position.y + ", " + player.position.x + ">");
                $('#tilepos').text("<" + (player.position.y / (tilemap.halfheight * 2)) + ", " + (player.position.x / (tilemap.halfwidth * 2)) + ">");
                $('#weapon').text((player.weapon) ? player.weapon.id : "none");
                $('#hp').text(player.hp);


                map_height = tilemap.data[0].length;
                map_width  = tilemap.data[0][0].length;
                camera_bounds = {
                    minx: canvas.width / 2,
                    miny: canvas.height / 2,
                    maxx: (map_width * 64) - (canvas.width / 2),
                    maxy: (map_height * 64)- (canvas.height / 2)
                };

                camera.follow(player.position, camera_bounds);

                canvas.drawMap(tiles, tilemap, camera);
                canvas.drawPlayer(tiles, player);
                canvas.drawEnemies(tiles, enemies);
                canvas.drawForeground(tiles, tilemap, camera);

                canvas.drawConsole(tiles, cout, camera);

                canvas.render(camera);
                timeSince = timeSince % frametime;
            }

            lastTime = currentTime;

            window.requestAnimFrame(step);
        };

        step();

    });

}(jQuery));