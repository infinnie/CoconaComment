var Cocona = (function () {
    "use strict";
    var frames = {}, done = {};
    if (typeof window.addEventListener === "function") {
        window.addEventListener("message", function (e) {
            var frameName = e.source.name;
            if (!done[frameName]) {
                done[frameName] = true;
                frames[frameName].style.opacity = "1";
            }
            frames[frameName].style.height = e.data + "px";
        }, false);
    } else {
        window.onmessage = function (e) {
            e = e || window.event;
            frames[e.source.name].style.height = e.data + "px";
        };
    }
    return {
        init: function (id, theme) {
            var elem = document.getElementById(id),
                ifr = document.createElement("iframe"),
                frameName = ("CoconaComment" + Math.random()).replace(/\W/g, "");
            if (!elem) { return; }
            ifr.name = frameName;
            frames[frameName] = ifr;
            done[frameName] = false;
            ifr.src = "/index.html" + (theme ? "?theme=" + theme : "");
            ifr.setAttribute("frameborder", "0");
            ifr.setAttribute("allowtransparency", "true");
            ifr.style.cssText = "opacity:0;transition:opacity .5s;";
            elem.appendChild(ifr);
        }
    };
}());