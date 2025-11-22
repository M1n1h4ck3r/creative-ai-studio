const { GoogleGenerativeAI } = require("@google/generative-ai");

// Get API key from command line argument
const apiKey = process.argv[2];

if (!apiKey) {
    console.error("Please provide your API Key as an argument.");
    console.error("Usage: node list-models.js YOUR_API_KEY");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        console.log("Fetching available models...");
        // For v1beta, we might need to use the model manager if available, 
        // but the SDK usually exposes it via getGenerativeModel or similar?
        // Actually, the SDK doesn't have a direct 'listModels' on the main class in all versions.
        // Let's try to use the raw API if the SDK doesn't support it easily, 
        // but the error message said "Call ListModels".

        // In the Node SDK, it's often not directly exposed on genAI instance in older versions,
        // but let's try to see if we can hit the endpoint or if there's a method.
        // Checking documentation (simulated): SDK usually has a ModelManager or similar?
        // Or we can just try to generate with a known model and see the error, but we want the list.

        // Let's try a simple fetch to the API endpoint directly to be sure, avoiding SDK version issues.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
        }

        const data = await response.json();

        if (data.models) {
            console.log("\nAvailable Models:");
            data.models.forEach(model => {
                console.log(`- ${model.name} (${model.supportedGenerationMethods.join(", ")})`);
            });
        } else {
            console.log("No models found in response.");
        }

    } catch (error) {
        console.error("Error listing models:", error.message);
    }
}

listModels();
