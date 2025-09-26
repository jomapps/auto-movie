import { z } from "zod"

// Project validation schema based on clarified requirements
export const projectSchema = z.object({
  title: z
    .string()
    .min(1, "Project title is required")
    .max(200, "Project title cannot exceed 200 characters"),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
  genre: z.enum(
    ["action", "comedy", "drama", "horror", "sci-fi", "thriller", "romance", "documentary"],
    {
      required_error: "Genre is required",
      invalid_type_error: "Please select a valid genre",
    }
  ),
  episodeCount: z
    .number()
    .int("Episode count must be a whole number")
    .min(1, "Episode count must be at least 1")
    .max(50, "Episode count cannot exceed 50")
    .default(10),
  targetAudience: z
    .enum(["children", "family", "teen", "adult"], {
      invalid_type_error: "Please select a valid target audience",
    })
    .default("family"),
  projectSettings: z.object({
    aspectRatio: z
      .enum(["16:9", "4:3", "21:9"], {
        invalid_type_error: "Please select a valid aspect ratio",
      })
      .default("16:9"),
    episodeDuration: z
      .number()
      .int("Episode duration must be a whole number")
      .min(5, "Episode duration must be at least 5 minutes")
      .max(120, "Episode duration cannot exceed 120 minutes")
      .default(22),
    qualityTier: z
      .enum(["draft", "standard", "premium"], {
        invalid_type_error: "Please select a valid quality tier",
      })
      .default("standard"),
  }).default({}),
})

// Type inference from schema
export type ProjectFormData = z.infer<typeof projectSchema>

// Schema for updating existing projects (all fields optional except ID)
export const updateProjectSchema = projectSchema.partial().extend({
  id: z.string().min(1, "Project ID is required"),
})

export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>

// Schema for project filters (used in listing page)
export const projectFiltersSchema = z.object({
  genre: z.enum(["action", "comedy", "drama", "horror", "sci-fi", "thriller", "romance", "documentary"]).optional(),
  status: z.enum(["concept", "pre-production", "production", "post-production", "completed", "on-hold"]).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "title", "status", "progress"]).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
})

export type ProjectFilters = z.infer<typeof projectFiltersSchema>