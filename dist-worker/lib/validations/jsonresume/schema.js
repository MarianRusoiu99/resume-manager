"use strict";
/**
 * Core Resume Schema
 *
 * Single source of truth for JSON Resume schema definitions.
 * Provides base schema and validation variants.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumeSchema = void 0;
const zod_1 = require("zod");
const iso8601Schema = zod_1.z.string().optional();
const urlSchema = zod_1.z.string().optional();
const emailSchema = zod_1.z.string().optional();
const locationSchema = zod_1.z.object({
    address: zod_1.z.string().optional(),
    postalCode: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    countryCode: zod_1.z.string().optional(),
    region: zod_1.z.string().optional(),
}).passthrough();
const profileSchema = zod_1.z.object({
    network: zod_1.z.string().optional(),
    username: zod_1.z.string().optional(),
    url: urlSchema,
}).passthrough();
const basicsSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    label: zod_1.z.string().optional(),
    image: zod_1.z.string().optional(),
    email: emailSchema,
    phone: zod_1.z.string().optional(),
    url: urlSchema,
    summary: zod_1.z.string().optional(),
    location: locationSchema.optional(),
    profiles: zod_1.z.array(profileSchema).optional(),
}).passthrough();
const workSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    position: zod_1.z.string().optional(),
    url: urlSchema,
    startDate: iso8601Schema,
    endDate: iso8601Schema,
    summary: zod_1.z.string().optional(),
    highlights: zod_1.z.array(zod_1.z.string()).optional(),
}).passthrough();
const volunteerSchema = zod_1.z.object({
    organization: zod_1.z.string().optional(),
    position: zod_1.z.string().optional(),
    url: urlSchema,
    startDate: iso8601Schema,
    endDate: iso8601Schema,
    summary: zod_1.z.string().optional(),
    highlights: zod_1.z.array(zod_1.z.string()).optional(),
}).passthrough();
const educationSchema = zod_1.z.object({
    institution: zod_1.z.string().optional(),
    url: urlSchema,
    area: zod_1.z.string().optional(),
    studyType: zod_1.z.string().optional(),
    startDate: iso8601Schema,
    endDate: iso8601Schema,
    score: zod_1.z.string().optional(),
    courses: zod_1.z.array(zod_1.z.string()).optional(),
}).passthrough();
const awardSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    date: zod_1.z.string().optional(),
    awarder: zod_1.z.string().optional(),
    summary: zod_1.z.string().optional(),
}).passthrough();
const certificateSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    date: zod_1.z.string().optional(),
    issuer: zod_1.z.string().optional(),
    url: urlSchema,
}).passthrough();
const publicationSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    publisher: zod_1.z.string().optional(),
    releaseDate: iso8601Schema,
    url: urlSchema,
    summary: zod_1.z.string().optional(),
}).passthrough();
const skillSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    level: zod_1.z.string().optional(),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
}).passthrough();
const languageSchema = zod_1.z.object({
    language: zod_1.z.string().optional(),
    fluency: zod_1.z.string().optional(),
}).passthrough();
const interestSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
}).passthrough();
const referenceSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    reference: zod_1.z.string().optional(),
}).passthrough();
const projectSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    highlights: zod_1.z.array(zod_1.z.string()).optional(),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
    startDate: iso8601Schema,
    endDate: iso8601Schema,
    url: urlSchema,
    roles: zod_1.z.array(zod_1.z.string()).optional(),
    entity: zod_1.z.string().optional(),
    type: zod_1.z.string().optional(),
}).passthrough();
const metaSchema = zod_1.z.object({
    canonical: zod_1.z.string().optional(),
    lastModified: zod_1.z.string().optional(),
}).catchall(zod_1.z.unknown()).passthrough();
exports.resumeSchema = zod_1.z.object({
    $schema: zod_1.z.string().optional(),
    basics: basicsSchema.optional(),
    work: zod_1.z.array(workSchema).optional(),
    volunteer: zod_1.z.array(volunteerSchema).optional(),
    education: zod_1.z.array(educationSchema).optional(),
    awards: zod_1.z.array(awardSchema).optional(),
    certificates: zod_1.z.array(certificateSchema).optional(),
    publications: zod_1.z.array(publicationSchema).optional(),
    skills: zod_1.z.array(skillSchema).optional(),
    languages: zod_1.z.array(languageSchema).optional(),
    interests: zod_1.z.array(interestSchema).optional(),
    references: zod_1.z.array(referenceSchema).optional(),
    projects: zod_1.z.array(projectSchema).optional(),
    meta: metaSchema.optional(),
}).passthrough();
