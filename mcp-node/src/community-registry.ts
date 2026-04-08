/**
 * Community Skill Registry — submission, validation, and publishing pipeline.
 * ==========================================================================
 * Enables community members to submit skills for review, validate submitted
 * skills via trust-gated voting, and publish approved skills to the marketplace.
 *
 * Uses the on-chain TrustBridge for trust-gated validation votes and
 * SkillRegistry/ValidationRegistry contracts for on-chain registration.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, cpSync, rmSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomUUID, createHash } from "crypto";
import { TrustBridge } from "./trust-bridge.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SubmissionStatus = "pending" | "validating" | "approved" | "rejected" | "published";

export interface SkillSubmission {
  /** Unique submission ID */
  submission_id: string;
  /** Skill name (directory name in marketplace) */
  skill_name: string;
  /** Author identifier (address or name) */
  author: string;
  /** Author's node address (for on-chain registration) */
  author_address?: string;
  /** Submission status */
  status: SubmissionStatus;
  /** When submitted */
  submitted_at: string;
  /** When last status changed */
  updated_at: string;
  /** Validation votes received */
  validations: ValidationVote[];
  /** Minimum validations required to approve */
  min_validations: number;
  /** Approval threshold (fraction of positive votes required) */
  approval_threshold: number;
  /** Manifest metadata */
  manifest: Record<string, unknown>;
  /** SHA-256 hash of skill.md content for integrity */
  content_hash: string;
  /** Version string */
  version: string;
}

export interface ValidationVote {
  voter: string;
  vote: "approve" | "reject";
  trust_score: number;
  reason: string;
  timestamp: string;
}

export interface SubmissionResult {
  success: boolean;
  submission_id?: string;
  error?: string;
  skill_name?: string;
}

export interface PublishResult {
  success: boolean;
  error?: string;
  skill_name?: string;
  marketplace_path?: string;
}

// ---------------------------------------------------------------------------
// Community Registry
// ---------------------------------------------------------------------------

export class CommunityRegistry {
  private pendingDir: string;
  private indexPath: string;
  private submissions: SkillSubmission[];
  private trustBridge: TrustBridge;
  private marketplaceDir: string;

  constructor(marketplaceDir: string, rpcUrl?: string) {
    const baseDir = join(homedir(), ".skillchain", "community");
    this.pendingDir = join(baseDir, "pending");
    this.indexPath = join(baseDir, "submissions.json");
    mkdirSync(this.pendingDir, { recursive: true });
    this.submissions = this.loadIndex();
    this.trustBridge = new TrustBridge(rpcUrl);
    this.marketplaceDir = marketplaceDir;
  }

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------

  /**
   * Submit a new skill for community review.
   * Validates the format and stages files in the pending directory.
   */
  submitSkill(
    skillName: string,
    skillMdContent: string,
    manifest: Record<string, unknown>,
    author: string,
    authorAddress?: string,
  ): SubmissionResult {
    // Validate skill name
    const safeName = skillName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, "");
    if (safeName.length < 3 || safeName.length > 50) {
      return { success: false, error: "Skill name must be 3-50 characters (lowercase, hyphens)" };
    }

    // Check for duplicates (name already in marketplace or pending)
    if (existsSync(join(this.marketplaceDir, safeName, "skill.md"))) {
      return { success: false, error: `Skill '${safeName}' already exists in the marketplace` };
    }
    const existing = this.submissions.find(s => s.skill_name === safeName && s.status !== "rejected");
    if (existing) {
      return { success: false, error: `Skill '${safeName}' already has a pending submission (${existing.submission_id})` };
    }

    // Validate skill.md content
    if (skillMdContent.length < 100) {
      return { success: false, error: "skill.md content too short (minimum 100 characters)" };
    }
    if (skillMdContent.length > 200_000) {
      return { success: false, error: "skill.md content too large (maximum 200KB)" };
    }

    // Validate manifest has required fields
    const requiredFields = ["name", "domain", "description"];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        return { success: false, error: `manifest.json missing required field: ${field}` };
      }
    }

    // Stage files
    const skillDir = join(this.pendingDir, safeName);
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, "skill.md"), skillMdContent, "utf-8");
    writeFileSync(join(skillDir, "manifest.json"), JSON.stringify({
      ...manifest,
      name: safeName,
      version: manifest.version ?? "1.0.0",
      license: manifest.license ?? "OPEN",
      price: manifest.price ?? "0",
    }, null, 2), "utf-8");

    // Create submission record
    const submission: SkillSubmission = {
      submission_id: randomUUID().slice(0, 16),
      skill_name: safeName,
      author,
      author_address: authorAddress,
      status: "pending",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      validations: [],
      min_validations: 3,
      approval_threshold: 0.67,
      manifest,
      content_hash: createHash("sha256").update(skillMdContent).digest("hex"),
      version: (manifest.version as string) ?? "1.0.0",
    };

    this.submissions.push(submission);
    this.saveIndex();

    return { success: true, submission_id: submission.submission_id, skill_name: safeName };
  }

  // -----------------------------------------------------------------------
  // Validate
  // -----------------------------------------------------------------------

  /**
   * Cast a validation vote on a submitted skill.
   * Trust-gated: voter's trust score is recorded with the vote.
   */
  async validateSkill(
    submissionId: string,
    voter: string,
    vote: "approve" | "reject",
    reason: string,
  ): Promise<{ success: boolean; error?: string; new_status?: SubmissionStatus }> {
    const submission = this.submissions.find(s => s.submission_id === submissionId);
    if (!submission) {
      return { success: false, error: `Submission '${submissionId}' not found` };
    }
    if (submission.status !== "pending" && submission.status !== "validating") {
      return { success: false, error: `Submission is '${submission.status}', not accepting votes` };
    }

    // Check if voter already voted
    if (submission.validations.some(v => v.voter === voter)) {
      return { success: false, error: `Voter '${voter}' has already voted on this submission` };
    }

    // Get voter's trust score
    let trustScore = 0.5;
    try {
      const trust = await this.trustBridge.getSkillTrust(voter);
      trustScore = trust.combined;
    } catch { /* use default */ }

    // Record vote
    submission.validations.push({
      voter,
      vote,
      trust_score: trustScore,
      reason,
      timestamp: new Date().toISOString(),
    });

    // Update status
    submission.status = "validating";
    submission.updated_at = new Date().toISOString();

    // Check if enough validations to decide
    if (submission.validations.length >= submission.min_validations) {
      const totalTrust = submission.validations.reduce((s, v) => s + v.trust_score, 0);
      const approveTrust = submission.validations
        .filter(v => v.vote === "approve")
        .reduce((s, v) => s + v.trust_score, 0);

      const approvalRate = totalTrust > 0 ? approveTrust / totalTrust : 0;

      if (approvalRate >= submission.approval_threshold) {
        submission.status = "approved";
      } else {
        submission.status = "rejected";
      }
    }

    this.saveIndex();

    return { success: true, new_status: submission.status };
  }

  // -----------------------------------------------------------------------
  // Publish
  // -----------------------------------------------------------------------

  /**
   * Publish an approved skill to the marketplace.
   */
  publishSkill(submissionId: string): PublishResult {
    const submission = this.submissions.find(s => s.submission_id === submissionId);
    if (!submission) {
      return { success: false, error: `Submission '${submissionId}' not found` };
    }
    if (submission.status !== "approved") {
      return { success: false, error: `Submission is '${submission.status}', must be 'approved' to publish` };
    }

    const sourceDir = join(this.pendingDir, submission.skill_name);
    const targetDir = join(this.marketplaceDir, submission.skill_name);

    if (!existsSync(sourceDir)) {
      return { success: false, error: `Source files not found at ${sourceDir}` };
    }

    // Copy to marketplace
    mkdirSync(targetDir, { recursive: true });
    cpSync(sourceDir, targetDir, { recursive: true });

    // Write provenance file
    writeFileSync(join(targetDir, "provenance.json"), JSON.stringify({
      author: submission.author,
      author_address: submission.author_address,
      submitted_at: submission.submitted_at,
      published_at: new Date().toISOString(),
      version: submission.version,
      content_hash: submission.content_hash,
      validations: submission.validations.length,
      approval_rate: submission.validations.filter(v => v.vote === "approve").length / submission.validations.length,
    }, null, 2), "utf-8");

    // Update submission status
    submission.status = "published";
    submission.updated_at = new Date().toISOString();
    this.saveIndex();

    // Clean up pending directory
    try { rmSync(sourceDir, { recursive: true, force: true }); } catch { /* */ }

    return { success: true, skill_name: submission.skill_name, marketplace_path: targetDir };
  }

  // -----------------------------------------------------------------------
  // List / Query
  // -----------------------------------------------------------------------

  /**
   * List community submissions with optional status filter.
   */
  listSubmissions(
    statusFilter?: SubmissionStatus,
    limit: number = 20,
  ): Array<{
    submission_id: string;
    skill_name: string;
    author: string;
    status: SubmissionStatus;
    submitted_at: string;
    validations_count: number;
    approval_votes: number;
    reject_votes: number;
    description: string;
  }> {
    let results = this.submissions;
    if (statusFilter) {
      results = results.filter(s => s.status === statusFilter);
    }

    return results
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
      .slice(0, limit)
      .map(s => ({
        submission_id: s.submission_id,
        skill_name: s.skill_name,
        author: s.author,
        status: s.status,
        submitted_at: s.submitted_at,
        validations_count: s.validations.length,
        approval_votes: s.validations.filter(v => v.vote === "approve").length,
        reject_votes: s.validations.filter(v => v.vote === "reject").length,
        description: (s.manifest.description as string) ?? "",
      }));
  }

  /**
   * Get full details of a specific submission.
   */
  getSubmission(submissionId: string): SkillSubmission | null {
    return this.submissions.find(s => s.submission_id === submissionId) ?? null;
  }

  // -----------------------------------------------------------------------
  // Persistence
  // -----------------------------------------------------------------------

  private loadIndex(): SkillSubmission[] {
    if (existsSync(this.indexPath)) {
      try { return JSON.parse(readFileSync(this.indexPath, "utf-8")); } catch { /* */ }
    }
    return [];
  }

  private saveIndex(): void {
    writeFileSync(this.indexPath, JSON.stringify(this.submissions, null, 2), "utf-8");
  }
}
