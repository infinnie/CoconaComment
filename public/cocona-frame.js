/*jslint browser:true*/
(function ($, ko) {
    "use strict";
    var count = 0, comments = window.comments = ko.observableArray([]);
    ko.applyBindings(comments);
    
    $(function () {
        var prevHeight = 0, running = false, link = $("<link>").attr("rel", "stylesheet"), calcHeight = function (ts, dur) {
            var requestAnimationFrame = window.requestAnimationFrame;
            ts = +ts || +new Date();
            dur = dur || 400;
            if (+new Date() - ts > dur) {
                count = count + 1;
                return;
            }
            prevHeight = $("html").height();
            parent.postMessage(prevHeight + 10, "*");
            // setTimeout(calcHeight, 50, ts);
            if (typeof requestAnimationFrame === "function") {
                requestAnimationFrame(function () {
                    calcHeight(ts, dur);
                });
            } else {
                setTimeout(function () { calcHeight(ts, dur); }, 30);
            }
        };
        
        if (/[?&]theme=dark(?:&|$)/i.test(location.search)) {
            // do something
            link.attr("href", "/dark.css");
        } else {
            link.attr("href", "/light.css");
        }
        
        link.appendTo("head");
        
        $("#editor").on("focus blur", function () {
            calcHeight();
        }).on("keyup", function () {
            calcHeight(null, 1);
        });
        calcHeight(+new Date(), 1);
        
        $.getJSON("/comments/?" + (+new Date()), function (data) {
            $.each(data, function () {
                // console.log(this);
                comments.push(this);
            });
            calcHeight(+new Date(), 1);
        });
    });
}(window.jQuery, window.ko));