/**
 * Renders text on an image with automatic text wrapping and size adjustment
 * @param {HTMLImageElement} image - The source image
 * @param {string} text - The text to render (comma-separated for multiple lines)
 * @returns {Promise<string>} - Returns a Promise that resolves to the data URL of the rendered image
 */
export const renderTextOnImage = (image, text) => {
    return new Promise((resolve) => {
        // Create canvas and get context
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions to match image
        canvas.width = image.width;
        canvas.height = image.height;

        // Draw the original image
        ctx.drawImage(image, 0, 0);

        // Split text at commas and create pairs of [beforeComma, afterComma]
        const textPairs = text.split(',').map((line, index, array) => {
            if (index % 2 === 0 && index + 1 < array.length) {
                return [line.trim(), array[index + 1].trim()];
            }
            return index % 2 === 0 ? [line.trim()] : null;
        }).filter(pair => pair !== null);

        // Calculate maximum width for text (70% of image width)
        const maxWidth = image.width * 0.7;

        // Start with a large font size and decrease until it fits
        let fontSize = image.height;
        ctx.textAlign = 'left';
        
        // Function to wrap text and return array of lines
        const wrapText = (text, maxWidth, fontSize) => {
            ctx.font = `${fontSize}px Arial`;
            const words = text.split(' ');
            const lines = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = ctx.measureText(currentLine + ' ' + word).width;
                if (width < maxWidth) {
                    currentLine += ' ' + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);
            return lines;
        };

        // Function to check if text fits within image height
        const textFits = (allLines, fontSize) => {
            const totalHeight = allLines.length * (fontSize * 1.2); // 1.2 for line spacing
            return totalHeight <= image.height * 0.9; // Leave 10% margin
        };

        // Find the largest font size that fits
        let allWrappedLines = [];
        while (fontSize > 1) {
            allWrappedLines = [];

            // Process each text pair
            for (const pair of textPairs) {
                if (pair[0]) {
                    const wrappedLines1 = wrapText(pair[0], maxWidth, fontSize);
                    allWrappedLines.push(...wrappedLines1.map(line => ({ text: line, color: 'white' })));
                }
                if (pair[1]) {
                    const wrappedLines2 = wrapText(pair[1], maxWidth, fontSize);
                    allWrappedLines.push(...wrappedLines2.map(line => ({ text: line, color: 'red' })));
                }
            }

            if (textFits(allWrappedLines, fontSize)) {
                break;
            }

            fontSize -= 1;
        }

        // Calculate vertical position to center the text
        const lineHeight = fontSize * 1.2;
        const totalTextHeight = allWrappedLines.length * lineHeight;
        let currentY = (image.height - totalTextHeight) / 2;

        // Draw the text
        ctx.font = `${fontSize}px Arial`;
        allWrappedLines.forEach(line => {
            // Set the appropriate color for this line
            ctx.fillStyle = line.color;
            ctx.strokeStyle = 'black';
            
            // Draw text stroke (outline)
            ctx.lineWidth = fontSize * 0.05; // Adjust outline thickness based on font size
            ctx.strokeText(line.text, 20, currentY);
            
            // Draw text fill
            ctx.fillText(line.text, 20, currentY);
            
            currentY += lineHeight;
        });

        // Return the rendered image as a data URL
        resolve(canvas.toDataURL('image/jpeg', 0.9));
    });
};

/**
 * Helper function to load an image from a URL
 * @param {string} url - The URL of the image to load
 * @returns {Promise<HTMLImageElement>} - Returns a Promise that resolves to the loaded image
 */
export const loadImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Enable CORS
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
};

// Example usage:
/*
const main = async () => {
    try {
        const image = await loadImage('path/to/your/image.jpg');
        const text = 'First line of text, Second line of text, Third line';
        const renderedImage = await renderTextOnImage(image, text);
        
        // Use the rendered image (data URL)
        const imgElement = document.createElement('img');
        imgElement.src = renderedImage;
        document.body.appendChild(imgElement);
    } catch (error) {
        console.error('Error:', error);
    }
};
*/ 