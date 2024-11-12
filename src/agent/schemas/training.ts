import { z } from 'zod';

export const TrainingBlockSchema = z.object({
    trainingBlock: z.object({
        name: z
            .string()
            .describe("The name of the training block, e.g., 'CrossFit Competitor Block'."),
        durationWeeks: z
            .number()
            .min(1)
            .describe("The duration of the training block in weeks."),
        goal: z
            .string()
            .describe(
                "The primary objective or focus of the training block, e.g., 'Prepare for CrossFit Open with a focus on strength and gymnastics.'"
            ),
        schedule: z
            .array(
                z.object({
                    day: z
                        .enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
                        .describe("The day of the week for this schedule entry, e.g., 'Monday'."),
                    instructions: z
                        .string()
                        .describe("A detailed set of instructions of how to construct workouts for this day including how they should progress over the course of the training block."),
                    // sessions: z
                    //     .array(
                    //         z.object({
                    //             name: z
                    //                 .string()
                    //                 .describe("The name of the session, e.g., 'Session 1' or 'Self-Guided Recovery'."),
                    //             instructions: z
                    //                 .string()
                    //                 .describe("A detailed set of instructions of how to construct workouts for this day including how they should progress. Should be 2 paragraphs."),
                    //             components: z
                    //                 .array(
                    //                     z.string().describe("An individual component of the session, e.g., 'Bamboo Bar OHS'. Do not include sets or reps.")
                    //                 )
                    //                 .describe("A list of components or exercises included in this session.")
                    //         })
                    //     )
                    //     .describe("An array of sessions planned for the given day.")
                })
            )
            .describe("The weekly schedule containing daily plans and sessions.")
    })
});


export const MovementSchema = z.object({
    name: z.string().describe("Name of the movement, e.g., 'Bench Press'."),
    type: z.enum(["strength", "aerobic", "mobility", "recovery"]).describe(
        "The type of movement: strength, aerobic, mobility, or recovery."
    ),
    sets: z
        .number()
        .optional()
        .describe("Number of sets for strength or mobility movements."),
    reps: z
        .union([z.number(), z.string()])
        .optional()
        .describe(
            "Number of repetitions for strength or mobility movements. Can be 'Max effort' for bodyweight exercises."
        ),
    weight: z
        .string()
        .optional()
        .describe(
            "Weights for strength movements, e.g., '75% of max' or '50lbs'."
        ),
    rest: z
        .string()
        .optional()
        .describe("Rest time between sets or movements, e.g., '90 seconds'."),
    tempo: z
        .string()
        .optional()
        .describe(
            "Tempo for strength movements, written as 'eccentric-pause-concentric-pause'."
        ),
    duration: z
        .union([z.string(), z.number()])
        .optional()
        .describe(
            "Duration for aerobic movements, holds, or mobility exercises, e.g., '40 minutes' or '30 seconds per leg'."
        ),
    pace: z
        .string()
        .optional()
        .describe(
            "Pace for aerobic movements. This is required for all run sessions. e.g., '75% of max heart rate' or '6:00/mile' or '5:00/km."
        ),
    intervals: z
        .array(
            z.object({
                effort: z.string().describe("Effort level or pace for the interval."),
                duration: z.string().describe("Duration of the interval."),
                rest: z.string().optional().describe("Rest between intervals.")
            })
        )
        .optional()
        .describe("Details for interval training."),
    targetAreas: z
        .array(z.string())
        .optional()
        .describe(
            "Target areas for mobility or recovery movements, e.g., ['Quads', 'Hamstrings']."
        ),
    notes: z
        .string()
        .optional()
        .describe(
            "Additional instructions or context for the movement, e.g., 'Focus on controlled movement with full range of motion.'"
        )
});

export const SessionSchema = z.object({
    sessionName: z
        .string()
        .describe("Name of the session, e.g., 'Strength Training'."),
    explanation: z
        .string()
        .describe(
            "A extremely detailed explanation of how to properly perform the session. For example, you should explain how to execute the running intervals."
        ),
    movements: z
        .array(MovementSchema)
        .describe("List of movements included in the session.")
});

export const DayTrainingSchema = z.object({
    dayTraining: z.object({
        // date: z
        //     .string()
        //     .describe(
        //         "The specific date for the training session, formatted as 'YYYY-MM-DD'."
        //     ),
        day: z
            .enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
            .describe("The day of the week for the training to be performed."),
        sessions: z
            .array(SessionSchema)
            .describe("Array of sessions planned for the day.")
    })
});

export const TrainingWeekReflectionSchema = z.object({
    trainingWeekReview: z.array(z.object({
        day: z
            .enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
            .describe("The day of the week for the training to be performed."),
        reflection: z
            .string()
            .describe("A thorough review of the training day.")
    })
    )
});
