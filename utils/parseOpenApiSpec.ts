export interface ParsedSpec {
    spec: any;
    tags: string[];
  }
  
  export function parseOpenApiSpec(spec: any): ParsedSpec {
    const tags = new Set<string>();
  
    // Extract unique tags from paths
    Object.values(spec.paths).forEach((path: any) => {
      Object.values(path).forEach((method: any) => {
        if (method.tags && Array.isArray(method.tags)) {
          method.tags.forEach((tag: string) => tags.add(tag));
        }
      });
    });
  
    return {
      spec,
      tags: Array.from(tags).sort(),
    };
  }
  
  