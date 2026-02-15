import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPath = path.join(__dirname, 'src/pages/Gitpluse.jsx');

try {
    let fileContent = fs.readFileSync(targetPath, 'utf8');

    // 1. Replace the container class
    const oldContainerClass = 'className="w-full relative z-10 overflow-hidden"';
    const newContainerClass = 'className="w-full relative z-10 overflow-x-auto pb-4 custom-scrollbar"';

    if (fileContent.includes(oldContainerClass)) {
        fileContent = fileContent.replace(oldContainerClass, newContainerClass);
        console.log("Updated container class.");
    } else {
        console.warn("Container class not found!");
    }

    // 2. Replace the SVG class (context aware: search near the container replacement?)
    // Or just search for the specific SVG tag attributes if unique enough?
    // <svg ... viewBox="0 0 840 130" ... className="w-full h-auto"

    // Let's use a regex to find the SVG tag with specific viewBox
    const svgRegex = /<svg\s+viewBox="0 0 840 130"\s+className="w-full h-auto"/;
    const match = fileContent.match(svgRegex);

    if (match) {
        const replacement = '<svg \n                    viewBox="0 0 840 130" \n                    className="w-full h-auto min-w-[800px]"';
        // Note: the original might have newlines.
        // Let's just replacing the className part if we are sure it's the right SVG.

        // Alternative: Find the block we surely know creates the heatmap.
        // It's inside the div we just modified (or tried to).

        // We can just replace 'className="w-full h-auto"' with 'className="w-full h-auto min-w-[800px]"'
        // BUT we must be careful not to replace other SVGs.
        // The heatmap SVG has `style={{ maxHeight: '220px' }}` right after.

        const strictSearch = 'className="w-full h-auto"\n                    style={{ maxHeight: \'220px\' }}';
        const strictReplace = 'className="w-full h-auto min-w-[800px]"\n                    style={{ maxHeight: \'220px\' }}';

        // This relies on exact newline/spacing.
        // Let's use the file logic:

        // Look for viewBox="0 0 840 130"
        const index = fileContent.indexOf('viewBox="0 0 840 130"');
        if (index !== -1) {
            // Find the next className="..."
            const nextClassIndex = fileContent.indexOf('className="w-full h-auto"', index);
            if (nextClassIndex !== -1 && nextClassIndex < index + 100) {
                // Replace it
                // We can use string slicing to be safe
                const before = fileContent.substring(0, nextClassIndex);
                const after = fileContent.substring(nextClassIndex + 'className="w-full h-auto"'.length);
                fileContent = before + 'className="w-full h-auto min-w-[800px]"' + after;
                console.log("Updated SVG class.");
            } else {
                console.warn("SVG className not found near viewBox.");
            }
        } else {
            console.warn("SVG viewBox not found.");
        }

    }

    fs.writeFileSync(targetPath, fileContent, 'utf8');
    console.log("Successfully patched Gitpluse.jsx for responsiveness");

} catch (err) {
    console.error("Error patching file:", err);
    process.exit(1);
}
