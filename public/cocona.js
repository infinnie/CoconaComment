var Cocona = (function () {
    "use strict";
    var frames = {};
    if (typeof window.addEventListener === "function") {
        window.addEventListener("message", function (e) {
            frames[e.source.name].style.height = e.data + "px";
        }, false);
    } else {
        window.onmessage = function (e) {
            frames[e.source.name].style.height = e.data + "px";
        };
    }
    return {
        init: function (id, theme) {
            var elem = document.getElementById(id), ifr = document.createElement("iframe"), frameName = ("CoconaComment" + Math.random()).replace(/\W/g, "");
            if (!elem) { return; }
            ifr.name = frameName;
            ifr.src = "/index.html" + (theme ? "?theme=" + theme : "");
            frames[frameName] = ifr;
            elem.appendChild(ifr);
        }
    };
}());