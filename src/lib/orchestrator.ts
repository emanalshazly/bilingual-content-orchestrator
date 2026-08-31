import { GoogleGenAI } from "@google/genai";
import * as schemas from "./schemas";
import { PROMPTS } from "./prompts";
import { validatePipelineInputs, type PipelineInputs } from "./contracts";

export { validatePipelineInputs, type PipelineInputs } from "./contracts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type AgentStatus = "idle" | "running" | "complete" | "error";

export interface PipelineState {
  core: AgentStatus;
  enBlog: AgentStatus;
  enSocial: AgentStatus;
  enEmail: AgentStatus;
  enVideo: AgentStatus;
  arBlog: AgentStatus;
  arSocial: AgentStatus;
  arEmail: AgentStatus;
  arVideo: AgentStatus;
  brandReview: AgentStatus;
  qualityEval: AgentStatus;
}

export interface PipelineOutputs {
  core?: any;
  enBlog?: any;
  enSocial?: any;
  enEmail?: any;
  enVideo?: any;
  arBlog?: any;
  arSocial?: any;
  arEmail?: any;
  arVideo?: any;
  brandReview?: any;
  qualityEval?: any;
}

async function runAgent(
  modelName: string,
  systemInstruction: string,
  prompt: string,
  schema: any
) {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (err) {
    console.error("Agent Error:", err);
    throw err;
  }
}

export async function reRunAgent(
  agentId: keyof PipelineOutputs,
  inputs: PipelineInputs,
  allOutputs: PipelineOutputs,
  feedback: string,
  updateStatus: (agent: keyof PipelineState, status: AgentStatus) => void,
  updateOutput: (agent: keyof PipelineOutputs, data: any) => void
) {
  validatePipelineInputs(inputs);
  const model = "gemini-3-flash-preview";
  updateStatus(agentId, "running");

  let promptTemplate = "";
  let schema: any = null;
  let payload: any = {};

  switch (agentId) {
    case "core":
      promptTemplate = PROMPTS.coreMessaging;
      schema = schemas.coreMessagingSchema;
      payload = { product_brief_text: inputs.productBrief, brand_guidelines_text: inputs.brandGuidelines, previous_content_examples: [inputs.previousExamplesEN], announcement_context: "Global launch" };
      break;
    case "enBlog":
      promptTemplate = PROMPTS.enBlog;
      schema = schemas.enBlogSchema;
      payload = { core_messaging: allOutputs.core, blog_examples: [inputs.previousExamplesEN], seo_keywords: inputs.seoKeywords.split(',').map(k => k.trim()).filter(Boolean), target_word_count: 800 };
      break;
    case "enSocial":
      promptTemplate = PROMPTS.enSocial;
      schema = schemas.enSocialSchema;
      payload = { core_messaging: allOutputs.core, social_examples: [inputs.previousExamplesEN], platforms: ["LinkedIn", "X", "Instagram", "Facebook", "Threads"] };
      break;
    case "enEmail":
      promptTemplate = PROMPTS.enEmail;
      schema = schemas.enEmailSchema;
      payload = { core_messaging: allOutputs.core, email_examples: [inputs.previousExamplesEN], subscriber_segment: "all", newsletter_format: "standard" };
      break;
    case "enVideo":
      promptTemplate = PROMPTS.enVideo;
      schema = schemas.enVideoSchema;
      payload = { core_messaging: allOutputs.core, script_examples: [inputs.previousExamplesEN], video_format: "announcement", target_duration_seconds: 90 };
      break;
    case "arBlog":
      promptTemplate = PROMPTS.arBlog;
      schema = schemas.arBlogSchema;
      payload = { en_blog_output: allOutputs.enBlog, core_messaging: allOutputs.core, ar_brand_guidelines: inputs.brandGuidelines, ar_content_examples: [inputs.previousExamplesAR], arabic_register: "MSA" };
      break;
    case "arSocial":
      promptTemplate = PROMPTS.arSocial;
      schema = schemas.arSocialSchema;
      payload = { en_social_output: allOutputs.enSocial, core_messaging: allOutputs.core, ar_brand_guidelines: inputs.brandGuidelines, ar_content_examples: [inputs.previousExamplesAR], arabic_register: "MSA" };
      break;
    case "arEmail":
      promptTemplate = PROMPTS.arEmail;
      schema = schemas.arEmailSchema;
      payload = { en_email_output: allOutputs.enEmail, core_messaging: allOutputs.core, ar_brand_guidelines: inputs.brandGuidelines, ar_content_examples: [inputs.previousExamplesAR], arabic_register: "MSA" };
      break;
    case "arVideo":
      promptTemplate = PROMPTS.arVideo;
      schema = schemas.arVideoSchema;
      payload = { en_script_output: allOutputs.enVideo, core_messaging: allOutputs.core, ar_brand_guidelines: inputs.brandGuidelines, ar_content_examples: [inputs.previousExamplesAR], arabic_register: "MSA", target_audience_region: "MENA" };
      break;
    case "brandReview":
      promptTemplate = PROMPTS.brandReview;
      schema = schemas.brandReviewSchema;
      payload = { core_messaging: allOutputs.core, outputs: { enBlog: allOutputs.enBlog, enSocial: allOutputs.enSocial, enEmail: allOutputs.enEmail, enVideo: allOutputs.enVideo, arBlog: allOutputs.arBlog, arSocial: allOutputs.arSocial, arEmail: allOutputs.arEmail, arVideo: allOutputs.arVideo } };
      break;
    case "qualityEval":
      promptTemplate = PROMPTS.qualityEval;
      schema = schemas.qualityEvalSchema;
      payload = { review_output: allOutputs.brandReview, outputs: { enBlog: allOutputs.enBlog, enSocial: allOutputs.enSocial, enEmail: allOutputs.enEmail, enVideo: allOutputs.enVideo, arBlog: allOutputs.arBlog, arSocial: allOutputs.arSocial, arEmail: allOutputs.arEmail, arVideo: allOutputs.arVideo } };
      break;
    default:
      throw new Error(`Unknown agent ID: ${agentId}`);
  }

  let finalPrompt = "";
  if (feedback) {
    finalPrompt = `
=== REVISION REQUEST ===
You must revise your previous output based on the following feedback:
"${feedback}"

=== PREVIOUS OUTPUT ===
${JSON.stringify(allOutputs[agentId], null, 2)}

=== ORIGINAL INPUT PAYLOAD ===
${JSON.stringify(payload, null, 2)}

Please provide the complete revised output in the required JSON format.
    `;
  } else {
    finalPrompt = JSON.stringify(payload);
  }

  try {
    const out = await runAgent(model, promptTemplate, finalPrompt, schema);
    updateOutput(agentId, out);
    updateStatus(agentId, "complete");
  } catch (err) {
    console.error(err);
    updateStatus(agentId, "error");
    throw err;
  }
}

export async function executePipeline(
  inputs: PipelineInputs,
  updateStatus: (agent: keyof PipelineState, status: AgentStatus) => void,
  updateOutput: (agent: keyof PipelineOutputs, data: any) => void
) {
  validatePipelineInputs(inputs);
  const model = "gemini-3-flash-preview"; // Fast and supports structured output well

  try {
    // 1. Core Messaging
    updateStatus("core", "running");
    const corePrompt = JSON.stringify({
      product_brief_text: inputs.productBrief,
      brand_guidelines_text: inputs.brandGuidelines,
      previous_content_examples: [inputs.previousExamplesEN],
      announcement_context: "Global launch",
    });
    const coreOutput = await runAgent(model, PROMPTS.coreMessaging, corePrompt, schemas.coreMessagingSchema);
    updateOutput("core", coreOutput);
    updateStatus("core", "complete");

    // 2. EN Fan-out (Parallel)
    const enTasks = [
      (async () => {
        updateStatus("enBlog", "running");
        const out = await runAgent(model, PROMPTS.enBlog, JSON.stringify({ core_messaging: coreOutput, blog_examples: [inputs.previousExamplesEN], seo_keywords: inputs.seoKeywords.split(',').map(k => k.trim()).filter(Boolean), target_word_count: 800 }), schemas.enBlogSchema);
        updateOutput("enBlog", out);
        updateStatus("enBlog", "complete");
        return out;
      })(),
      (async () => {
        updateStatus("enSocial", "running");
        const out = await runAgent(model, PROMPTS.enSocial, JSON.stringify({ core_messaging: coreOutput, social_examples: [inputs.previousExamplesEN], platforms: ["LinkedIn", "X", "Instagram", "Facebook", "Threads"] }), schemas.enSocialSchema);
        updateOutput("enSocial", out);
        updateStatus("enSocial", "complete");
        return out;
      })(),
      (async () => {
        updateStatus("enEmail", "running");
        const out = await runAgent(model, PROMPTS.enEmail, JSON.stringify({ core_messaging: coreOutput, email_examples: [inputs.previousExamplesEN], subscriber_segment: "all", newsletter_format: "standard" }), schemas.enEmailSchema);
        updateOutput("enEmail", out);
        updateStatus("enEmail", "complete");
        return out;
      })(),
      (async () => {
        updateStatus("enVideo", "running");
        const out = await runAgent(model, PROMPTS.enVideo, JSON.stringify({ core_messaging: coreOutput, script_examples: [inputs.previousExamplesEN], video_format: "announcement", target_duration_seconds: 90 }), schemas.enVideoSchema);
        updateOutput("enVideo", out);
        updateStatus("enVideo", "complete");
        return out;
      })()
    ];

    const [enBlog, enSocial, enEmail, enVideo] = await Promise.all(enTasks);

    // 3. AR Fan-out (Parallel)
    const arTasks = [
      (async () => {
        updateStatus("arBlog", "running");
        const out = await runAgent(model, PROMPTS.arBlog, JSON.stringify({ en_blog_output: enBlog, core_messaging: coreOutput, ar_brand_guidelines: inputs.brandGuidelines, ar_content_examples: [inputs.previousExamplesAR], arabic_register: "MSA" }), schemas.arBlogSchema);
        updateOutput("arBlog", out);
        updateStatus("arBlog", "complete");
        return out;
      })(),
      (async () => {
        updateStatus("arSocial", "running");
        const out = await runAgent(model, PROMPTS.arSocial, JSON.stringify({ en_social_output: enSocial, core_messaging: coreOutput, ar_brand_guidelines: inputs.brandGuidelines, ar_content_examples: [inputs.previousExamplesAR], arabic_register: "MSA" }), schemas.arSocialSchema);
        updateOutput("arSocial", out);
        updateStatus("arSocial", "complete");
        return out;
      })(),
      (async () => {
        updateStatus("arEmail", "running");
        const out = await runAgent(model, PROMPTS.arEmail, JSON.stringify({ en_email_output: enEmail, core_messaging: coreOutput, ar_brand_guidelines: inputs.brandGuidelines, ar_content_examples: [inputs.previousExamplesAR], arabic_register: "MSA" }), schemas.arEmailSchema);
        updateOutput("arEmail", out);
        updateStatus("arEmail", "complete");
        return out;
      })(),
      (async () => {
        updateStatus("arVideo", "running");
        const out = await runAgent(model, PROMPTS.arVideo, JSON.stringify({ en_script_output: enVideo, core_messaging: coreOutput, ar_brand_guidelines: inputs.brandGuidelines, ar_content_examples: [inputs.previousExamplesAR], arabic_register: "MSA", target_audience_region: "MENA" }), schemas.arVideoSchema);
        updateOutput("arVideo", out);
        updateStatus("arVideo", "complete");
        return out;
      })()
    ];

    const [arBlog, arSocial, arEmail, arVideo] = await Promise.all(arTasks);

    // 4. Brand Review
    updateStatus("brandReview", "running");
    const reviewPrompt = JSON.stringify({
      core_messaging: coreOutput,
      outputs: { enBlog, enSocial, enEmail, enVideo, arBlog, arSocial, arEmail, arVideo }
    });
    const reviewOut = await runAgent(model, PROMPTS.brandReview, reviewPrompt, schemas.brandReviewSchema);
    updateOutput("brandReview", reviewOut);
    updateStatus("brandReview", "complete");

    // 5. Quality Eval
    updateStatus("qualityEval", "running");
    const evalPrompt = JSON.stringify({
      review_output: reviewOut,
      outputs: { enBlog, enSocial, enEmail, enVideo, arBlog, arSocial, arEmail, arVideo }
    });
    const evalOut = await runAgent(model, PROMPTS.qualityEval, evalPrompt, schemas.qualityEvalSchema);
    updateOutput("qualityEval", evalOut);
    updateStatus("qualityEval", "complete");

  } catch (error) {
    console.error("Pipeline failed", error);
    // In a real app, we'd find which agent failed and update its status
    throw error;
  }
}
