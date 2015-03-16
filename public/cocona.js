var count = 0;
jQuery(function ($) {
    var prevHeight = 0, running = false, calcHeight = function (ts, dur) {
        ts = +ts || +new Date();
        dur = dur || 400;
        if (+new Date() - ts > dur) {
            count++;
            return;
        }
        prevHeight = $("html").height();
        parent.postMessage(prevHeight + 10, "*");
        // setTimeout(calcHeight, 50, ts);
        if ("requestAnimationFrame" in window) {
            requestAnimationFrame(function () {
                calcHeight(ts, dur);
            });
        } else {
            setTimeout(function () { calcHeight(ts, dur); }, 30);
        }
    };
    $("#editor").on("focus blur", function () {
        calcHeight();
    }).on("keyup", function () {
        calcHeight(null, 1)
    });
    calcHeight(+new Date(), 1);
});