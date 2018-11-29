"use strict";

var primaryServer = "ws://" + (window.location.hostname || "localhost") + ":8067/";
var color = [0, 0, 0, 1];'rgba(0,0,0,1)';
var fillColor = [255, 255, 255, 1];
var sketchpad;

function initColorPicker() {

    if (typeof(sketchpad.getCurrentTool().getColor) === "function" ) {
        color = Object.values(sketchpad.getCurrentTool().getColor());
    }
    if (typeof(sketchpad.getCurrentTool().getFillColor) === "function" ) {
        fillColor = Object.values(sketchpad.getCurrentTool().getFillColor());
    }

    $('#color').colorpicker({
      color: "rgba(" + color.join() + ")",
      format: 'rgb',
      popover: {
        animation: true,
        placement: 'left',
        boundary: 'viewport'
      },
    })
    .on('colorpickerChange', e => setToolColor(e));

    $('#fill-color').colorpicker({
      color: "rgba(" + fillColor.join() + ")",
      format: 'rgb',
      popover: {
        animation: true,
        placement: 'left',
        boundary: 'viewport'
      },
    })
    .on('colorpickerChange', e => setToolFillColor(e));
}

function setToolColor(newColor) {
    if ( typeof(sketchpad.getCurrentTool().setColor) !== "function" ) {
        return;
    }
    if ( newColor != undefined ) {
        color = newColor.value.toRgbString().replace("rgba(", "").replace("rgb(", "").replace(")", "").split(", ").map(function (x) { 
            return parseFloat(x); 
        });
    }
    sketchpad.getCurrentTool().setColor(...color);
    window.sketchpad = sketchpad;
}

function setToolFillColor(newColor) {
    if ( typeof(sketchpad.getCurrentTool().setFillColor) !== "function" ) {
        return;
    }
    if ( newColor != undefined ) {
        fillColor = newColor.value.toRgbString().replace("rgba(", "").replace("rgb(", "").replace(")", "").split(", ").map(function (x) { 
            return parseFloat(x); 
        });
    }
    sketchpad.getCurrentTool().setFillColor(...fillColor);
    window.sketchpad = sketchpad;
}

function selectTool(toolName) {
    sketchpad.setTool(toolName)
    document.querySelectorAll(".tool.button").forEach(function (el) {
        el.classList.remove("active");
    });
    document.getElementById("tool-" + toolName).classList.add("active");
    setToolColor();
    setToolFillColor();

    window.sketchpad = sketchpad;
}

function jsonToDraw(sketchpad, inputList) {
    var i,
        input;

    sketchpad.reset();
    sketchpad.receiveMessageFromServer({data: JSON.stringify({cmd: "history-begin"})});
    sketchpad.sendMessageToServer({cmd: "history-begin"});

    for (i = 0; i < inputList.length; i += 1) {
        input = inputList[i];
        input.bid = 0;
        input.uid = sketchpad.UID;
        if (input.config && input.config.sid) {
            console.log("PAGE: Input.cmd", input.cmd, input.config, input.config.sid);
        } else {
            console.log("Input: Input.cmd", input.cmd, input.sid);
        }

        sketchpad.sendMessageToServer(inputList[i]);
        sketchpad.receiveMessageFromServer({data: JSON.stringify(inputList[i])});
    }
    sketchpad.receiveMessageFromServer({data: JSON.stringify({cmd: "history-end"})});
    sketchpad.sendMessageToServer({cmd: "history-end"});
    //select current page?
    return inputList;
}

function initTools() {
    initColorPicker();

    document.getElementById('tool-load').addEventListener("click", function () {
        loadFile(".json,application/json", function (data) {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error("Error parsing file", e);
                return;
            }
            if (Array.isArray(data)) {
                return jsonToDraw(sketchpad, data);
            } else {
                console.error("Wrong file content");
                return;
            }
        });
    });

    document.getElementById('tool-save').addEventListener("click", function () {
        var data = sketchpad.saveSketchpad(true);
        saveFile(JSON.stringify(data), sketchpad.room.room_token + ".json", "text/json");
    });

    document.getElementById('tool-screenshot').addEventListener("click", function () {
        sketchpad.screenshot(function (blob) {
            saveFile(blob, sketchpad.room.room_token + ".png", "image/png");
        }, "image/png", 1);

    });

    //pen
    document.getElementById('tool-pen').addEventListener("click", function () {
        selectTool("pen");
    });

    // marker
    document.getElementById('tool-highlighter').addEventListener("click", function () {
        selectTool("highlighter");
    });

    // mandala
    document.getElementById('tool-mandala').addEventListener("click", function () {
        selectTool("mandala");
    });

    // type
    document.getElementById('tool-type').addEventListener("click", function () {
        selectTool("type");
    });

    //eraser
    document.getElementById('tool-eraser').addEventListener("click", function () {
        selectTool("eraser");
    });


    //cutout
    document.getElementById('tool-cutout').addEventListener("click", function () {
        selectTool("cutout");
    });

    document.getElementById('tool-rectangle').addEventListener("click", function () {
        selectTool("rectangle");
    });

    document.getElementById('tool-line').addEventListener("click", function () {
        selectTool("line");
    });

    document.getElementById('tool-circle').addEventListener("click", function () {
        selectTool("circle");
    });

    document.getElementById('tool-rainbow').addEventListener("click", function () {
        selectTool("rainbow");
    });

    document.getElementById('tool-move-viewport').addEventListener("click", function () {
        selectTool("move-viewport");
    });

    document.getElementById('tool-rotate-viewport').addEventListener("click", function () {
        selectTool("rotate-viewport");
    });

    document.getElementById('tool-zoom-in').addEventListener("click", function () {
        sketchpad.setScale(sketchpad.scale * 2);
    });
    document.getElementById('tool-zoom-1').addEventListener("click", function () {
        sketchpad.setScale(1);
        sketchpad.setViewportPosition(0, 0);
        sketchpad.setRotation(0);
    });

    document.getElementById('tool-zoom-out').addEventListener("click", function () {
        sketchpad.setScale(sketchpad.scale / 2);
    });

    document.getElementById('reset').addEventListener("click", function () {
        sketchpad.clearSketchpad();
    });

    document.getElementById('tool-undo').addEventListener("click", function () {
        sketchpad.undo();
    });
    document.getElementById('tool-redo').addEventListener("click", function () {
        sketchpad.redo();
    });
}

function startSketchpad(ws) {
    sketchpad = new Sketchpad({
        containerEl: document.getElementById("sketchpad"),
        token: window.location.hash || "#default",
        ws: ws,
        createPageConfig: {sid: "#1page_token"},
        features: {
            displayCrosshair: false
        },
    });

    selectTool("pen");
    window.sketchpad = sketchpad;

    initTools(sketchpad);
}

function initSketchpad() {
    if ( window.location.hash == "" ) {
        generateHash()
    }
    
    var ws = new WebSocket(primaryServer);
    function onError(e) {
        ws.removeEventListener("error", onError);
    }
    function onOpen() {
        if (ws.readyState === 1 ) {
            ws.removeEventListener("error", onError);
            startSketchpad(ws);
        }
    }
    ws.addEventListener("open", onOpen);
    ws.addEventListener("error", onError);

    window.addEventListener("hashchange", function () {
        window.location.reload();
    });
}

function generateHash() {
    var hash = '#' + Math.random().toString(36).substring(2, 8);
    if(history.pushState) {
        history.pushState(null, null, hash);
    } else {
        window.location.hash = hash;
    }
}

initSketchpad();


