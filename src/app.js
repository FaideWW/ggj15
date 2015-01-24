/**
 * Created by faide on 1/23/2015.
 */





window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();

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
        fillQueue:   []
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

    canvasObj.drawMap = (function (tilemap) {
        var x, y, h, w;
        h = tilemap.data.length;
        for (y = 0; y < h; y += 1) {
            w = tilemap.data[y].length;
            for (x = 0; x < w; x += 1) {
                if (tilemap.data[y][x] === 'x') {
                    this.drawRect(((x * 2) + 1) * tilemap.halfwidth, ((y * 2) + 1) * tilemap.halfheight, tilemap.halfwidth, tilemap.halfheight);
                }
            }
        }
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

function initTilemap(canvas, filepath, dict, thw, thh) {
    var image = new Image,
        padZero = function (num, pad) {
            return new Array(pad + 1 - (num + '').length).join('0') + num;
        },
        tilemap = {
            data: [[]],
            halfwidth: thw,
            halfheight: thh
        };

    image.onload = function () {
        var data, i, l, r, g, b, hexcolor,
            row = -1;
        // instantaneous, should never be seen
        canvas.ctx.drawImage(image, 0, 0, image.width, image.height);

        data = canvas.ctx.getImageData(0, 0, image.width, image.height).data;
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

        canvas.clear();

    };

    image.src = filepath;

    return tilemap;
}

var tilemap = {
    "ffffff": 'x'
};


(function ($) {
    var fps = 60,
        frametime = 1000 / fps,
        lastTime = 0,
        currentTime = 0,
        timeSince = 0,
        dt;

    $(document).ready(function () {
        var canvas, camera, map,
            step,
            box1, box2;
        $('#message').text('Hello world!');

        canvas = initCanvas('#canvas');
        camera = initCamera(canvas.width / 2, canvas.height / 2);

        canvas.clear();


        box1 = {
            x: 10,
            y: 10
        };

        box2 = {
            x: 10,
            y: 30
        };

        map = initTilemap(canvas, "img/map.png", tilemap, 32, 32);


        window.canvas = canvas;
        window.map    = map;

        // game loop
        step = function () {
            console.log('stepping');
            currentTime = new Date().getTime();
            dt = currentTime - lastTime;
            timeSince += dt;

            if (timeSince >= frametime) {
                // step
                box1.x += 0.1;
                box2.x += 0.2;

                //canvas.drawRect(box1.x, box1.y, 10, 10);
                //canvas.drawRect(box2.x, box2.y, 10, 10);

                canvas.drawMap(map);

                canvas.render(camera);
            }

            lastTime = currentTime;

            window.requestAnimFrame(step);
        };

        step();

    });

}(jQuery));