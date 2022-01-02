const { ipcRenderer } = require('electron');
const CHANNEL_NAME = 'screenshot';
let locationStart = { x: 0, y: 0 };
let locationEnd = { x: 0, y: 0 };
let isDrawing = false;
let image = new Image();

function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function init(imageBlob) {
    const canvas = document.createElement('canvas');
    canvas.width = 3440;
    canvas.height = 1440;
    canvas.style.width = '3440px';
    canvas.style.height = '1440px';

    document.body.insertBefore(canvas, document.body.firstChild);
    const context = canvas.getContext('2d');

    image.onload = function () {
        context.drawImage(image, 0, 0);
        onScreenshowDrawn(canvas, context, imageBlob);

        ipcRenderer.send(CHANNEL_NAME, JSON.stringify({
            event: 'image_loaded',
        }));
    };

    image.src = imageBlob;

}

function onScreenshowDrawn(canvas, context, imageBlob) {
    document.addEventListener('mousedown', function (event) {
        event.preventDefault();
        locationStart = getMousePos(canvas, event);
        locationEnd = getMousePos(canvas, event);
        isDrawing = true;
    });

    for (const eventType of ['mouseup', 'mouseout', 'mousemove']) {
        document.addEventListener(eventType, (event) => {
            if (isDrawing) {
                onDrawRect(event, canvas, context, eventType);
            }

            if (eventType !== 'mousemove' && isDrawing) {
                ipcRenderer.send(CHANNEL_NAME, JSON.stringify({
                    event: 'screenshot_finish',
                    data: {
                        image: imageBlob,
                        dimensions: {
                            left: locationStart.x,
                            top: locationStart.y,
                            width: locationEnd.x - locationStart.x,
                            height: locationEnd.y - locationStart.y,
                        }
                    }
                }));

                isDrawing = false;
            }
        });
    }
}

function onDrawRect(event, canvas, context, eventType) {
    event.preventDefault();
    locationEnd = getMousePos(canvas, event);

    context.beginPath();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);

    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.strokeStyle = 'rgba(255, 255, 255, 1)';
    context.lineWidth = 1;
    context.rect(locationStart.x, locationStart.y, locationEnd.x - locationStart.x, locationEnd.y - locationStart.y);
    context.fill();
    context.stroke();
}
