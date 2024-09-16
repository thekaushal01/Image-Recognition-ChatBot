function appendMessage(content, isBot) {
    const chatbox = document.getElementById('chatbox');
    const message = document.createElement('div');
    message.className = 'message ' + (isBot ? 'bot' : 'user');

    if (typeof content === 'string') {
        message.textContent = content;
    } else if (content instanceof HTMLImageElement) {
        message.appendChild(content);
    }

    chatbox.appendChild(message);
    chatbox.scrollTop = chatbox.scrollHeight;
}

function resizeImage(img, maxWidth, maxHeight) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);

    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const resizedImg = document.createElement('img');
    resizedImg.src = canvas.toDataURL();

    return resizedImg;
}

function sendImage() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];

    if (!file) {
        appendMessage('Please select an image file.', false);
        return;
    }

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);

    img.onload = function() {
        const resizedImg = resizeImage(img, 300, 300); // Increase width to 300px
        appendMessage(resizedImg, false);  // Display the resized image in the chatbox

        const formData = new FormData();
        formData.append('file', file);

        fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.predictions && data.predictions.length > 0) {
                let resultText = 'I see: ';
                data.predictions.forEach(prediction => {
                    resultText += `${prediction.label} (${(prediction.probability * 100).toFixed(2)}%), `;
                });
                resultText = resultText.slice(0, -2) + '.';  // Remove trailing comma
                appendMessage(resultText, true);
            } else {
                appendMessage('Could not recognize the image.', true);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            appendMessage('An error occurred.', true);
        });
    };
}
