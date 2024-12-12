export function splitOpenApiSpec(spec: any) {
    const chunks = [];
    const chunkSize = 50; // Adjust this based on your needs
  
    // Split paths into chunks
    const pathEntries = Object.entries(spec.paths);
    for (let i = 0; i < pathEntries.length; i += chunkSize) {
      const chunkPaths = Object.fromEntries(pathEntries.slice(i, i + chunkSize));
      chunks.push({
        paths: chunkPaths,
        components: spec.components, // Include components in each chunk
      });
    }
  
    return chunks;
  }
  
  