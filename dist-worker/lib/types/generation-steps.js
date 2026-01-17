"use strict";
/**
 * Resume Generation Steps
 *
 * Type-safe step identifiers for resume generation progress tracking.
 * Used with progress callbacks to provide consistent UI updates.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultStepConfigs = exports.GenerationStep = void 0;
exports.getStepConfig = getStepConfig;
exports.createProgressUpdate = createProgressUpdate;
/**
 * Generation step identifiers
 */
exports.GenerationStep = {
    /** Initial setup */
    INIT: 'init',
    /** Loading user profile data */
    PROFILE: 'profile',
    /** Starting AI workflow */
    WORKFLOW: 'workflow',
    /** Analyzing job description */
    JOB_ANALYSIS: 'job-analysis',
    /** Matching profile to job requirements */
    PROFILE_MATCHING: 'profile-matching',
    /** Optimizing resume content */
    CONTENT_OPTIMIZATION: 'content-optimization',
    /** Validating ATS compatibility */
    FORMAT_VALIDATION: 'format-validation',
    /** Generating final resume */
    OUTPUT_GENERATION: 'output-generation',
    /** Saving to database */
    SAVE: 'save',
    /** Generation complete */
    COMPLETE: 'complete',
    /** Error occurred */
    ERROR: 'error',
};
/**
 * Default step configurations for resume generation
 */
exports.defaultStepConfigs = [
    { step: exports.GenerationStep.INIT, message: 'Initializing resume generation...', progress: 0 },
    { step: exports.GenerationStep.PROFILE, message: 'Loading your profile data...', progress: 5 },
    { step: exports.GenerationStep.WORKFLOW, message: 'Starting AI workflow...', progress: 15 },
    { step: exports.GenerationStep.JOB_ANALYSIS, message: 'Analyzing job description...', progress: 20 },
    { step: exports.GenerationStep.PROFILE_MATCHING, message: 'Matching your profile to job requirements...', progress: 40 },
    { step: exports.GenerationStep.CONTENT_OPTIMIZATION, message: 'Optimizing resume content...', progress: 60 },
    { step: exports.GenerationStep.FORMAT_VALIDATION, message: 'Validating ATS compatibility...', progress: 75 },
    { step: exports.GenerationStep.OUTPUT_GENERATION, message: 'Generating final resume...', progress: 85 },
    { step: exports.GenerationStep.SAVE, message: 'Saving resume to database...', progress: 95 },
    { step: exports.GenerationStep.COMPLETE, message: 'Resume generated successfully!', progress: 100 },
];
/**
 * Get step configuration by step ID
 */
function getStepConfig(step) {
    return exports.defaultStepConfigs.find(config => config.step === step);
}
/**
 * Create a progress update for a step
 */
function createProgressUpdate(step, customMessage) {
    const config = getStepConfig(step);
    if (config) {
        return customMessage ? { ...config, message: customMessage } : config;
    }
    return { step, message: customMessage || 'Processing...', progress: 50 };
}
