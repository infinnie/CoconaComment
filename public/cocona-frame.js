/*jslint browser:true*/
/// <reference path="../bower_components/jquery/jquery.js"/>
(function ($, ko) {
    "use strict";
    var count = 0, comments = window.comments = ko.observableArray([]);
    ko.applyBindings(comments);

    $(function () {
        var prevHeight = 0, link = $("<link>").attr("rel", "stylesheet"), calcHeight = function (ts, dur) {
            var raf = window.requestAnimationFrame;
            ts = +ts || +new Date();
            dur = dur || 400;
            if (+new Date() - ts > dur) {
                count = count + 1;
                return;
            }
            prevHeight = $("body").height();
            parent.postMessage(prevHeight + 10, "*");
            // setTimeout(calcHeight, 50, ts);
            if (typeof raf === "function") {
                raf.call(window, function () {
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

        $("#editorBox").addClass("empty").on("keyup", function () {
            calcHeight(null, 1);
        }).on("focusin", function () {
            $(this).removeClass("empty");
        }).on("focusout", function () {
            var textBox = $(this).find("[role=textbox]");
            if (textBox.is(":empty")
                    || (textBox.find("p,br,div").length === 1 && textBox.find("p,br,div").is(":empty") && !$.trim(textBox.text()))) {
                $(this).addClass("empty");
            }
        }).on("focusin focusout", function () {
            calcHeight();
        }).on("mousedown", "[data-command]", function () {
            document.execCommand($(this).attr("data-command"));
            return false;
        }).on("click", "[data-command]", function () {
            return false;
        }).on("keyup click", "[role=textbox],[data-command]", function () {
            $("#editorBox").find("[data-command]").each(function () {
                if (document.queryCommandState($(this).attr("data-command"))) {
                    $(this).addClass("active");
                } else {
                    $(this).removeClass("active");
                }
            });
        }).on("blur", "[role=textbox]", function () {
            $("#editorBox").find("[data-command]").removeClass("active");
        }).on("keypress", "[role=textbox]", function (e) {
            var selection, container, range, frag, p, done, that = this;
            if (e.keyCode === 13 && (!e.shiftKey) && (!e.ctrlKey)) {
                try {
                    selection = window.getSelection();
                    range = selection.getRangeAt(0);
                    range.deleteContents();
                    container = range.endContainer;
                    if (container.nodeType === 3) {
                        container = container.parentNode;
                    }
                    container = $(container).is("div,p,blockquote,pre") ? container : $(container).parent("div,p,blockquote,pre").get(0);
                    range.setEnd(container, container.childNodes.length);
                    frag = range.extractContents();
                    p = document.createElement("p");
                    p.appendChild(frag);
                    if (container === that) {
                        container = $(container).html("<p>" + $(container).html() + "</p>").find("p").get(0);
                    }
                    if (!$(p).text() && !$(p).find("br").length) {
                        $(p).append("<br>");
                    }
                    $(p).find("font").each(function () {
                        this.outerHTML = this.innerHTML;
                    });
                    range.setStartAfter(container);
                    range.insertNode(p);
                    while (p.firstChild && p.firstChild.nodeType === 1 && p.firstChild.nodeName.toLowerCase() !== "br") {
                        p = p.firstChild;
                    }
                    selection.collapse(p, 0);
                    done = true;
                } catch (x) { }
            }
            return !done;
        }).on("keydown", "[role=textbox]", function (e) {
            var done;
            if (e.keyCode === 66 && e.ctrlKey) {
                try {
                    document.execCommand("bold");
                    done = true;
                } catch (x) {
                    // do nothing
                }
            }
            if (e.keyCode === 73 && e.ctrlKey) {
                try {
                    document.execCommand("italic");
                    done = true;
                } catch (x1) {
                    // do nothing
                }
            }
            return !done;
        }).on("paste", "[role=textbox]", function (e) {
            e = e.originalEvent;
            var cd = e.clipboardData || window.clipboardData, that = this, done, text, hyperLink, selection, startContainer, container, range, isDiff, textArray, textNode, frag, p;
            // IE TP has no clipboardData for the event, yet
            // but does everything else like Chrome.
            if (cd) {
                try {
                    text = cd.getData("text/plain");
                } catch (x3) {
                    text = cd.getData("text");
                }
                if (text) {
                    if (/^(?:https?|ftp|mailto)\:\S+$/.test(text)) {
                        // TODO: insert hyperlink
                        hyperLink = document.createElement("a");
                        hyperLink.href = text;
                        hyperLink.innerHTML = text;
                        try {
                            range = window.getSelection().getRangeAt(0);
                            range.deleteContents();
                            range.insertNode(hyperLink);
                            range.collapse(false);
                            done = true;
                        } catch (x) {
                            try {
                                document.selection.createRange().pasteHTML(hyperLink.outerHTML);
                                done = true;
                            } catch (x1) {
                                // do nothing
                            }
                        }
                    } else {
                        try {
                            // TODO: repair hyperlinks
                            selection = window.getSelection();
                            range = selection.getRangeAt(0);

                            startContainer = range.startContainer;
                            if (startContainer.nodeType === 3) {
                                startContainer = startContainer.parentNode;
                            }
                            startContainer = $(startContainer).is("div,p,blockquote,pre") ? startContainer : $(startContainer).parent("div,p,blockquote,pre").get(0);

                            container = range.endContainer;
                            if (container.nodeType === 3) {
                                container = container.parentNode;
                            }
                            container = $(container).is("div,p,blockquote,pre") ? container : $(container).parent("div,p,blockquote,pre").get(0);

                            range.deleteContents();

                            if (startContainer === container) {
                                range.setEnd(container, container.childNodes.length);
                                frag = range.extractContents();
                                p = document.createElement("p");
                                p.appendChild(frag);
                            } else {
                                p = container;
                                container = startContainer;
                            }
                            if (container === that) {
                                container = $(container).html("<p>" + $(container).html() + "</p>").find("p").get(0);
                            }
                            if (!$(p).text() && !$(p).find("br").length) {
                                $(p).append("<br>");
                            }
                            $(p).find("font").each(function () {
                                this.outerHTML = this.innerHTML;
                            });
                            range.setStartAfter(container);
                            range.insertNode(p);

                            textArray = text.replace(/^[\r\n]+/, "").replace(/[\r\n]+$/, "").split(/[\r\n]+/);
                            frag = document.createDocumentFragment();
                            container.appendChild(document.createTextNode(textArray.shift() || ""));
                            if (textArray.length) {
                                range.setStart(p, 0);
                                textNode = document.createTextNode(textArray.pop() || "");
                                range.insertNode(textNode);
                                range.setStartBefore(p);
                                range.setEndBefore(p);
                                while (textArray.length) {
                                    p = document.createElement("p");
                                    p.appendChild(document.createTextNode(textArray.shift() || ""));
                                    frag.appendChild(p);
                                }
                                range.insertNode(frag);
                                range.setStartAfter(textNode);
                                range.setEndAfter(textNode);
                            } else {
                                range.selectNodeContents(p);
                                frag = range.extractContents();
                                range.selectNodeContents(container);
                                range.collapse(false);
                                range.insertNode(frag);
                                $(p).remove();
                                range.collapse(false);
                            }

                            // selection.collapse(p, 1);
                            done = true;
                            // }
                        } catch (x2) {
                            try {
                                document.selection.createRange().pasteHTML(text.replace(/^[\r\n]+/, "").replace(/[\r\n]+$/, "").replace(/[\r\n]+/g, "<\/p><p>"));
                                done = true;
                            } catch (x4) { }
                        }
                    }
                    return !done;
                }
            }
        }).on("submit", function () {
            return false;
        });
        $.getJSON("/comments/?" + (+new Date()), function (data) {
            $.each(data, function () {
                // console.log(this);
                comments.push(this);
            });
        });

        setTimeout(function () {
            calcHeight(+new Date(), 1);
        }, 400);
    });
}(window.jQuery, window.ko));