/**
 * Created by faide on 1/23/2015.
 */

function initCanvas(selector) {
    var $canvas = $(selector),
        canvasObj;
    if (!$canvas[0]) {
        console.error('Error loading canvas: no element found matching selector ' + selector);
        return null;
    }
    canvasObj = {
        el: $canvas,
        ctx: $canvas[0].getContext('2d'),
        width: $canvas.width(),
        height: $canvas.height()
    };

    //--------------------- defaults
    canvasObj._clearcolor                       = "rgba(0, 0, 0, 1)";
    canvasObj._strokewidth                      = 2;
    canvasObj._fillstyle                        = "rgba(255, 255, 255, 1)";
    canvasObj._strokestyle                      = "rgba(255, 255, 0, 1)";
    canvasObj.ctx.webkitImageSmoothingEnabled   = false;
    canvasObj.ctx.mozImageSmoothingEnabled      = false;



    // -------------------- functions
    canvasObj.clear = (function () {
        var oldfill         = this.ctx.fillstyle;
        this.ctx.fillstyle  = this._clearcolor;

        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillstyle  = oldfill;
    }).bind(canvasObj);

    canvasObj.drawRect = (function (x, y, hw, hh, fill, stroke, strokeWidth) {
        var oldfill, oldstroke, oldstrokewidth;

        // cache the previous values so they can be restored later
        oldfill = this.ctx.fillStyle;
        oldstroke = this.ctx.strokeStyle;
        oldstrokewidth = this.ctx.strokeWidth;


        this.ctx.fillStyle = fill || this._fillstyle;
        this.ctx.strokeStyle = stroke || this._strokestyle;
        this.ctx.strokeWidth = strokeWidth || this._strokewidth;

        this.ctx.strokeRect(x - hw, y - hw, hw * 2, hh * 2);
        this.ctx.fillRect(x - hw, y - hw, hw * 2, hh * 2);


        this.ctx.fillStyle = oldfill;
        this.ctx.strokeStyle = oldstroke;
        this.ctx.strokeWidth = oldstrokewidth;


    }).bind(canvasObj);

    return canvasObj;
}

(function ($) {

    $(document).ready(function () {
        var canvas;
        $('#message').text('Hello world!');

        canvas = initCanvas('#canvas');

        canvas.clear();

        canvas.drawRect(50, 50, 10, 10);
        canvas.drawRect(70, 50, 10, 10);

        window.canvas = canvas;
    });

}(jQuery));