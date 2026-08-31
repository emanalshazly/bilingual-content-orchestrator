export interface PipelineInputs {
  productBrief: string;
  brandGuidelines: string;
  previousExamplesEN: string;
  previousExamplesAR: string;
  seoKeywords: string;
}

export function validatePipelineInputs(inputs: PipelineInputs): void {
  if (!inputs.productBrief.trim()) {
    throw new Error("Product brief is required before running the pipeline.");
  }
  if (!inputs.brandGuidelines.trim()) {
    throw new Error("Brand guidelines are required before running the pipeline.");
  }
}
