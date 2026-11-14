import { z } from "zod";
import { moodEnum } from "./schema";

export const createMoodEntrySchema = z.strictObject({
    entryDate: z.iso.date(),
    mood: z.enum(moodEnum.enumValues),
    energy: z.number().int().min(1).max(5),
    nudge: z.string()
        .trim()
        .max(1000)
        .nullish()
        .transform((value) => value || null),
});