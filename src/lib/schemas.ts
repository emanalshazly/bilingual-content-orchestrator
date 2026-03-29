import { Type } from "@google/genai";

export const coreMessagingSchema = {
  type: Type.OBJECT,
  properties: {
    product_name: { type: Type.STRING },
    core_announcement: { type: Type.STRING, description: "one sentence — what is being announced" },
    primary_value_proposition: { type: Type.STRING, description: "one sentence — what it does for the user" },
    key_proof_points: { type: Type.ARRAY, items: { type: Type.STRING } },
    target_audiences: {
      type: Type.OBJECT,
      properties: {
        en: { type: Type.STRING, description: "demographic + motivational context" },
        ar: { type: Type.STRING, description: "demographic + cultural context" }
      }
    },
    brand_voice_descriptors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "specific adjectives, not generic" },
    forbidden_phrases: { type: Type.ARRAY, items: { type: Type.STRING } },
    tone_calibration: {
      type: Type.OBJECT,
      properties: {
        register: { type: Type.STRING },
        formality_en: { type: Type.STRING },
        formality_ar: { type: Type.STRING }
      }
    },
    key_claims_hierarchy: { type: Type.ARRAY, items: { type: Type.STRING }, description: "ordered most to least critical" },
    call_to_action: { type: Type.STRING },
    confidence: { type: Type.NUMBER }
  },
  required: ["product_name", "core_announcement", "primary_value_proposition", "key_proof_points", "target_audiences", "brand_voice_descriptors", "forbidden_phrases", "tone_calibration", "key_claims_hierarchy", "call_to_action", "confidence"]
};

export const enBlogSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    meta_description: { type: Type.STRING, description: "≤160 chars, includes primary keyword" },
    subheadings: { type: Type.ARRAY, items: { type: Type.STRING } },
    body: { type: Type.STRING, description: "full article in Markdown" },
    word_count: { type: Type.INTEGER },
    cta_placement: { type: Type.STRING, description: "inline/end/both + surrounding copy" },
    confidence: { type: Type.NUMBER }
  },
  required: ["title", "meta_description", "subheadings", "body", "word_count", "cta_placement", "confidence"]
};

export const enSocialSchema = {
  type: Type.OBJECT,
  properties: {
    platforms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          platform_name: { type: Type.STRING },
          variations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                variation_name: { type: Type.STRING, description: "e.g., 'Direct CTA', 'Storytelling', 'Data-driven'" },
                angle: { type: Type.STRING, description: "which claim this post leads with" },
                copy: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                character_count: { type: Type.INTEGER },
                cta: { type: Type.STRING }
              },
              required: ["variation_name", "angle", "copy", "hashtags", "character_count", "cta"]
            }
          }
        },
        required: ["platform_name", "variations"]
      }
    },
    confidence: { type: Type.NUMBER }
  },
  required: ["platforms", "confidence"]
};

export const enEmailSchema = {
  type: Type.OBJECT,
  properties: {
    subject_line: { type: Type.STRING },
    subject_line_candidates: { type: Type.ARRAY, items: { type: Type.STRING } },
    preview_text: { type: Type.STRING },
    headline: { type: Type.STRING },
    body_sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ["heading", "content"]
      }
    },
    cta_button_text: { type: Type.STRING },
    footer_note: { type: Type.STRING, description: "optional unsubscribe-adjacent note" },
    estimated_read_time: { type: Type.STRING },
    confidence: { type: Type.NUMBER }
  },
  required: ["subject_line", "subject_line_candidates", "preview_text", "headline", "body_sections", "cta_button_text", "footer_note", "estimated_read_time", "confidence"]
};

export const enVideoSchema = {
  type: Type.OBJECT,
  properties: {
    hook: { type: Type.STRING },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          section_title: { type: Type.STRING },
          script: { type: Type.STRING },
          duration_estimate_seconds: { type: Type.INTEGER },
          visual_cue: { type: Type.STRING, description: "what the editor should show here" }
        },
        required: ["section_title", "script", "duration_estimate_seconds", "visual_cue"]
      }
    },
    outro_cta: { type: Type.STRING },
    total_word_count: { type: Type.INTEGER },
    estimated_duration_seconds: { type: Type.INTEGER },
    confidence: { type: Type.NUMBER }
  },
  required: ["hook", "sections", "outro_cta", "total_word_count", "estimated_duration_seconds", "confidence"]
};

export const arBlogSchema = {
  type: Type.OBJECT,
  properties: {
    title_ar: { type: Type.STRING },
    meta_description_ar: { type: Type.STRING },
    subheadings_ar: { type: Type.ARRAY, items: { type: Type.STRING } },
    body_ar: { type: Type.STRING, description: "full article in Markdown, RTL-aware" },
    rtl_layout_notes: { type: Type.STRING },
    cultural_adaptations_made: { type: Type.ARRAY, items: { type: Type.STRING }, description: "adaptation: justification" },
    word_count_ar: { type: Type.INTEGER },
    confidence: { type: Type.NUMBER }
  },
  required: ["title_ar", "meta_description_ar", "subheadings_ar", "body_ar", "rtl_layout_notes", "cultural_adaptations_made", "word_count_ar", "confidence"]
};

export const arSocialSchema = {
  type: Type.OBJECT,
  properties: {
    platforms_ar: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          platform_name: { type: Type.STRING },
          variations_ar: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                variation_name: { type: Type.STRING },
                angle_ar: { type: Type.STRING },
                copy_ar: { type: Type.STRING },
                hashtags_ar: { type: Type.ARRAY, items: { type: Type.STRING } },
                character_count: { type: Type.INTEGER },
                cta_ar: { type: Type.STRING },
                cultural_notes: { type: Type.STRING }
              },
              required: ["variation_name", "angle_ar", "copy_ar", "hashtags_ar", "character_count", "cta_ar", "cultural_notes"]
            }
          }
        },
        required: ["platform_name", "variations_ar"]
      }
    },
    confidence: { type: Type.NUMBER }
  },
  required: ["platforms_ar", "confidence"]
};

export const arEmailSchema = {
  type: Type.OBJECT,
  properties: {
    subject_line_ar: { type: Type.STRING, description: "≤55 chars" },
    subject_line_ar_safe: { type: Type.STRING, description: "≤45 chars" },
    preview_text_ar: { type: Type.STRING },
    headline_ar: { type: Type.STRING },
    body_sections_ar: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading_ar: { type: Type.STRING },
          content_ar: { type: Type.STRING }
        },
        required: ["heading_ar", "content_ar"]
      }
    },
    cta_button_text_ar: { type: Type.STRING },
    rtl_layout_notes: { type: Type.STRING },
    cultural_adaptations_made: { type: Type.ARRAY, items: { type: Type.STRING } },
    confidence: { type: Type.NUMBER }
  },
  required: ["subject_line_ar", "subject_line_ar_safe", "preview_text_ar", "headline_ar", "body_sections_ar", "cta_button_text_ar", "rtl_layout_notes", "cultural_adaptations_made", "confidence"]
};

export const arVideoSchema = {
  type: Type.OBJECT,
  properties: {
    hook_ar: { type: Type.STRING },
    sections_ar: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          section_title_ar: { type: Type.STRING },
          script_ar: { type: Type.STRING },
          duration_estimate_seconds: { type: Type.INTEGER },
          visual_cue: { type: Type.STRING, description: "same as EN — shared by both versions" }
        },
        required: ["section_title_ar", "script_ar", "duration_estimate_seconds", "visual_cue"]
      }
    },
    outro_cta_ar: { type: Type.STRING },
    narration_notes: { type: Type.STRING, description: "dialect, pacing, emphasis notes for the voice artist" },
    estimated_duration_seconds: { type: Type.INTEGER },
    confidence: { type: Type.NUMBER }
  },
  required: ["hook_ar", "sections_ar", "outro_cta_ar", "narration_notes", "estimated_duration_seconds", "confidence"]
};

export const brandReviewSchema = {
  type: Type.OBJECT,
  properties: {
    consistency_issues: { type: Type.ARRAY, items: { type: Type.STRING } },
    voice_violations: { type: Type.ARRAY, items: { type: Type.STRING } },
    cross_language_parity_issues: { type: Type.ARRAY, items: { type: Type.STRING } },
    approved_pieces: { type: Type.ARRAY, items: { type: Type.STRING } },
    revision_required: { type: Type.ARRAY, items: { type: Type.STRING } },
    revision_instructions: {
      type: Type.OBJECT,
      properties: {
        blog_en: { type: Type.STRING },
        social_en: { type: Type.STRING },
        email_en: { type: Type.STRING },
        video_en: { type: Type.STRING },
        blog_ar: { type: Type.STRING },
        social_ar: { type: Type.STRING },
        email_ar: { type: Type.STRING },
        video_ar: { type: Type.STRING }
      }
    }
  },
  required: ["consistency_issues", "voice_violations", "cross_language_parity_issues", "approved_pieces", "revision_required", "revision_instructions"]
};

export const qualityEvalSchema = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING, description: "PASS|REVISE|FAIL" },
    score: { type: Type.NUMBER },
    dimension_scores: {
      type: Type.OBJECT,
      properties: {
        brand_voice: { type: Type.NUMBER },
        claim_accuracy: { type: Type.NUMBER },
        format_completeness: { type: Type.NUMBER },
        audience_appropriateness: { type: Type.NUMBER },
        cross_language_parity: { type: Type.NUMBER },
        editorial_quality: { type: Type.NUMBER },
        platform_compliance: { type: Type.NUMBER },
        rtl_technical_quality: { type: Type.NUMBER }
      }
    },
    per_piece_verdicts: {
      type: Type.OBJECT,
      properties: {
        blog_en: { type: Type.STRING },
        social_en: { type: Type.STRING },
        email_en: { type: Type.STRING },
        video_en: { type: Type.STRING },
        blog_ar: { type: Type.STRING },
        social_ar: { type: Type.STRING },
        email_ar: { type: Type.STRING },
        video_ar: { type: Type.STRING }
      }
    },
    revision_instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["verdict", "score", "dimension_scores", "per_piece_verdicts", "revision_instructions"]
};
