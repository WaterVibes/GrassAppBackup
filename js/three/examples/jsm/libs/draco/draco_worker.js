import { DracoDecoderModule } from './draco_decoder.js';

// Initialize the Draco decoder
let decoderModule;
let decoderPending;

// Handle messages from the main thread
self.onmessage = function(e) {
    const message = e.data;
    
    switch (message.type) {
        case 'init':
            // Initialize the decoder
            decoderPending = new Promise((resolve) => {
                decoderModule = DracoDecoderModule();
                decoderModule.onRuntimeInitialized = () => {
                    resolve();
                };
            });
            break;
            
        case 'decode':
            // Ensure decoder is initialized
            if (!decoderPending) {
                self.postMessage({ type: 'error', error: 'Decoder not initialized' });
                return;
            }
            
            // Decode the geometry
            decoderPending.then(() => {
                try {
                    const result = decoderModule.decode(message.buffer);
                    self.postMessage({
                        type: 'decode',
                        id: message.id,
                        geometry: result
                    }, [result.buffer]);
                } catch (error) {
                    self.postMessage({
                        type: 'error',
                        id: message.id,
                        error: error.message
                    });
                }
            });
            break;
    }
}; 