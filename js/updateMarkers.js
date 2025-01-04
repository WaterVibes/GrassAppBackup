const fs = require('fs');
const path = require('path');

const markersDir = './markers';

// Read all files in the markers directory
fs.readdir(markersDir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    files.forEach(file => {
        if (file.endsWith('.json')) {
            const filePath = path.join(markersDir, file);
            
            // Read and parse the JSON file
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            // Update camera coordinates if they exist
            if (data.camera) {
                const oldY = data.camera.y;
                data.camera.y = data.camera.z;
                data.camera.z = oldY;
            }
            
            // Update target coordinates if they exist
            if (data.target) {
                const oldY = data.target.y;
                data.target.y = data.target.z;
                data.target.z = oldY;
            }
            
            // Update subject coordinates if they exist
            if (data.subject) {
                const oldY = data.subject.y;
                data.subject.y = data.subject.z;
                data.subject.z = oldY;
            }
            
            // Write the updated data back to the file
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`Updated ${file}`);
        }
    });
}); 