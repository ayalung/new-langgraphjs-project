import { BaseMessage, BaseMessageLike, MessageContent } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { type z } from 'zod';
import { DayTrainingSchema, TrainingBlockSchema, TrainingWeekReflectionSchema } from "./schemas/training.js";

/**
 * A graph's StateAnnotation defines three main things:
 * 1. The structure of the data to be passed between nodes (which "channels" to read from/write to and their types)
 * 2. Default values for each field
 * 3. Reducers for the state's. Reducers are functions that determine how to apply updates to the state.
 * See [Reducers](https://langchain-ai.github.io/langgraphjs/concepts/low_level/#reducers) for more information.
 */

// This is the primary state of your agent, where you can store any information
export const StateAnnotation = Annotation.Root({
  /**
   * Messages track the primary execution state of the agent.
   *
   * Typically accumulates a pattern of:
   *
   * 1. HumanMessage - user input
   * 2. AIMessage with .tool_calls - agent picking tool(s) to use to collect
   *     information
   * 3. ToolMessage(s) - the responses (or errors) from the executed tools
   *
   *     (... repeat steps 2 and 3 as needed ...)
   * 4. AIMessage without .tool_calls - agent responding in unstructured
   *     format to the user.
   *
   * 5. HumanMessage - user responds with the next conversational turn.
   *
   *     (... repeat steps 2-5 as needed ... )
   *
   * Merges two lists of messages or message-like objects with role and content,
   * updating existing messages by ID.
   *
   * Message-like objects are automatically coerced by `messagesStateReducer` into
   * LangChain message classes. If a message does not have a given id,
   * LangGraph will automatically assign one.
   *
   * By default, this ensures the state is "append-only", unless the
   * new message has the same ID as an existing message.
   *
   * Returns:
   *     A new list of messages with the messages from \`right\` merged into \`left\`.
   *     If a message in \`right\` has the same ID as a message in \`left\`, the
   *     message from \`right\` will replace the message from \`left\`.`
   */
  clientAssessment: Annotation<string>(),
  currentDay: Annotation<Weekday | null>(),
  trainingBlockTemplate: Annotation<z.infer<typeof TrainingBlockSchema>>(),
  templateReflection: Annotation<MessageContent>(),
  days: Annotation<z.infer<typeof DayTrainingSchema>[], z.infer<typeof DayTrainingSchema>>({
    reducer: (a, b) => a.concat(b),
    default: () => []
  }),
  trainingWeekReflection: Annotation<z.infer<typeof TrainingWeekReflectionSchema>>(),
  finalWeekOfTraining: Annotation<z.infer<typeof DayTrainingSchema>[], z.infer<typeof DayTrainingSchema>>({
    reducer: (a, b) => a.concat(b),
    default: () => []
  }),
  messages: Annotation<BaseMessage[], BaseMessageLike[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  /**
   * Feel free to add additional attributes to your state as needed.
   * Common examples include retrieved documents, extracted entities, API connections, etc.
   *
   * For simple fields whose value should be overwritten by the return value of a node,
   * you don't need to define a reducer or default.
   */
  // additionalField: Annotation<string>,
});
