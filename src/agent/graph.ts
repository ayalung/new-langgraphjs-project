/**
 * Starter LangGraph.js Template
 * Make this code your own!
 */
import { StateGraph } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { StateAnnotation } from "./state.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getNextWeekday } from "../helpers/dateHelpers.js";
import { DayTrainingSchema, TrainingBlockSchema, TrainingWeekReflectionSchema } from "./schemas/training.js";



/**
 * Define a node, these do the work of the graph and should have most of the logic.
 * Must return a subset of the properties set in StateAnnotation.
 * @param state The current state of the graph.
 * @param config Extra parameters passed into the state graph.
 * @returns Some subset of parameters of the graph state, used to update the state
 * for the edges and nodes executed next.
 */
const generateTemplate = async (
  state: typeof StateAnnotation.State,
  _config: RunnableConfig,
): Promise<typeof StateAnnotation.Update> => {
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    maxTokens: 16384,
    temperature: 0.0
  });

  const systemContent = `You are an expert hybrid training coach and programming assistant. Your task is to generate a structured training block template tailored to an individual’s preferences, goals, and constraints. Use the user’s input to craft a clear and detailed training block, ensuring it aligns with their specified goals, abilities, and schedule.
	1.	Analyze the user’s input to extract key information, including their goals, training background, strengths, weaknesses, event preparation, preferences, and limitations.
	2.	Design a training block that reflects their weekly schedule, training modalities, and focus areas while adhering to any specified constraints (e.g., equipment access, injuries).
	3.	Structure the training block into a JSON format with the following elements:
	•	Name of the training block.
	•	Duration in weeks.
	•	Goal of the block.
	•	Daily schedule with detailed sessions and components. It should also include a clear set of instruction of how I should use each day in the training block to write workouts and progress them in future weeks.
  
  Tips:
  - Group body building workouts by groups. (e.g., Push, Pull, Legs)
  - It's extremely important that you follow the training schedule provided by the user.`;

  const userContent = `Create a template based on the user's onboarding information and any feedback if provided.
[User Onboarding Information]
${state.clientAssessment}

${state.templateReflection && `[Initial Template]
  ${JSON.stringify(state.trainingBlockTemplate, null, 2)}

  ## Implement the following feedback where appropriate.
  ${state.templateReflection}
`}
`

  const prompt = await ChatPromptTemplate.fromMessages([
    new SystemMessage({ content: systemContent }),
    new HumanMessage({ content: userContent }),
  ]);

  const llm = prompt.pipe(model.withStructuredOutput(TrainingBlockSchema));

  const res = await llm.invoke(state.messages);

  return {
    trainingBlockTemplate: res
  };
};

const generateTemplateReflection = async (
  state: typeof StateAnnotation.State,
  _config: RunnableConfig,
): Promise<typeof StateAnnotation.Update> => {
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    maxTokens: 16384,
    temperature: 0.0
  });
  const systemContent = `Review the generated training plan template in the context of the user’s onboarding questionnaire. Identify any discrepancies or areas where the plan may not fully align with the user’s stated goals, preferences, or constraints. Provide specific feedback on how the plan can be improved to better meet the user’s needs.
  When reviewing a hybrid athlete training program focused on running and bodybuilding, here are some critical aspects to ask and evaluate:

Program Structure

	1.	Balance Between Running and Bodybuilding:
	•	How is the training volume and intensity distributed between running and bodybuilding?
	•	Does the program prioritize one discipline over the other? If so, is this aligned with the athlete’s goals?
	2.	Progression Plan:
	•	Are there progressive overload principles applied to both running and bodybuilding components?
	•	Does the program outline phases (e.g., base building, strength, peak, taper) for both disciplines?
	3.	Periodization:
	•	Does the program incorporate periodization to manage fatigue and enhance performance?
	•	Are high-intensity running sessions balanced with lighter bodybuilding days (and vice versa)?

Specificity

	4.	Goal Alignment:
	•	Does the program reflect the athlete’s specific goals (e.g., distance running vs. sprinting, hypertrophy vs. strength)?
	•	Are the bodybuilding exercises chosen functional for running performance (e.g., posterior chain development)?
	5.	Aerobic vs. Anaerobic Training:
	•	Does the program integrate aerobic base work for running while managing anaerobic fatigue from bodybuilding sessions?
	6.	Muscle Recovery:
	•	Does the program account for delayed-onset muscle soreness (DOMS) from heavy lifts impacting running mechanics?

Workout Design

	9.	Exercise Selection:
	•	Are the bodybuilding exercises functional and supportive of running performance (e.g., Romanian deadlifts for hamstring strength)?
	•	Is there an appropriate mix of compound and isolation exercises for hypertrophy?
	10.	Running Training:
	•	Does the running plan include variety (e.g., intervals, tempo runs, long runs)?
	•	Are the running distances and intensities scalable based on fitness level?
	11.	Intensity Management:
	•	Are there clear intensity guidelines for both running and bodybuilding to avoid overtraining?
	12.	Warm-Up and Cool-Down:
	•	Does the program include dynamic warm-ups and cool-downs tailored to the hybrid athlete?

Injury Prevention

	13.	Injury Mitigation:
	•	Are exercises chosen to reduce injury risk, particularly for joints (e.g., knees, hips) stressed by both running and lifting?
	•	Does the program include accessory work for stability and mobility (e.g., core strengthening, hip mobility)?
	14.	Running Mechanics:
	•	Is there a focus on proper running form and cadence`;


  const prompt = await ChatPromptTemplate.fromMessages([
    new SystemMessage({ content: systemContent }),
    new HumanMessage({
      content: `Review the following training block template. Be extremely thorough in your review. You have the highest standard of excellence. It's important to heavily weight the user's onboarding information.
      [User Onboarding Information]
      ${state.clientAssessment}

      [Training Block Template]
      ${JSON.stringify(state.trainingBlockTemplate.trainingBlock, null, 2)}`
    }),
  ]);

  const llm = prompt.pipe(model);

  const res = await llm.invoke({});

  return {
    templateReflection: res.content
  };
};

const generateDay = async (
  state: typeof StateAnnotation.State,
  _config: RunnableConfig,
): Promise<typeof StateAnnotation.Update> => {
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    maxTokens: 16384,
    temperature: 0.0
  });

  const dayTemplate = state.trainingBlockTemplate.trainingBlock.schedule.filter((x) => x.day == state.currentDay);


  const systemContent = `You are an expert hybrid training coach and programming assistant. Your task is to generate today's training based off the block template.

  [Training Block Template]
  ${JSON.stringify(state.trainingBlockTemplate.trainingBlock, null, 2)}

  [Day Template]
  ${JSON.stringify(dayTemplate, null, 2)}

  [User Onboarding Information]
  ${state.clientAssessment}
  `;


  const prompt = await ChatPromptTemplate.fromMessages([
    new SystemMessage({ content: systemContent }),
    new HumanMessage({
      content: `Day Of The Week: {day}
    Tips:
    - Be extremely structured. Use specific paces and distances. Avoid vague workouts like 'Run for 60 minutes at an easy pace.' You should be be very specific in the targets and goals.
    - When writing body building, be very specific in movements, tempos, weights. These are advanced athletes you are writing a program for.
    - You should be very specific in the movement selection. For example, don't write 'Lunges', it should include the exact variation you want like 'Barbell Back Rack Reverse Lunges'.`}),
  ]);

  const llm = prompt.pipe(model.withStructuredOutput(DayTrainingSchema));

  const res = await llm.invoke({ day: state.currentDay });

  return {
    days: res,
    currentDay: getNextWeekday(state.currentDay)
  };
};

const generateWeekOfTrainingReflection = async (
  state: typeof StateAnnotation.State,
  _config: RunnableConfig,
): Promise<typeof StateAnnotation.Update> => {
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    maxTokens: 16384,
    temperature: 0.0
  });
  const systemContent = `Review the generated training plan for the week in the context of the user’s onboarding questionnaire and training block template. Identify any discrepancies or areas where the week of training may not fully align with the user’s stated goals, preferences, or constraints. Perform a Physiological Load Analysis (check workload balance). Provide specific feedback on how the training week can be improved to better meet the user’s needs.

  [Training Block Template]
  ${JSON.stringify(state.trainingBlockTemplate.trainingBlock, null, 2)}
  `;


  const prompt = await ChatPromptTemplate.fromMessages([
    new SystemMessage({ content: systemContent }),
    new HumanMessage({
      content: `Review the following week of training. Be extremely thorough in your review. You have the highest standard of excellence.
      [User Onboarding Information]
    ${state.clientAssessment}

      [Week of Training]
      ${JSON.stringify(state.days, null, 2)}
      
      Certainly! Here’s the updated analysis with an emphasis on structured running workouts rather than generalized durations:

1. Program Structure and Progression

	•	Questions:
	•	Is the weekly schedule balanced between aerobic, strength, and recovery sessions?
	•	Do running workouts have clear goals and structure (e.g., intervals, tempo, long runs with variations)?
	•	Does the program follow a logical progression for the individual’s goals (e.g., endurance, hypertrophy, lactate threshold)?
	•	Are there clear metrics or cues for progression over time (e.g., faster paces, longer intervals, heavier weights)?
	•	Factors to Analyze:
	•	Distribution of training modalities (e.g., aerobic vs. strength).
	•	Inclusion of structured running sessions (e.g., warm-ups, main set, cool-downs) that target specific adaptations.
	•	Progressive overload principles applied to both strength training and aerobic sessions.
	•	Variability to avoid plateauing while targeting specific adaptations.

2. Recovery and Adaptation

	•	Questions:
	•	Are there sufficient recovery days or sessions to prevent overtraining?
	•	Do active recovery and mobility work align with the intensity of the training week?
	•	Are running recovery strategies incorporated (e.g., slower-paced recovery runs, not just “rest”)?
	•	How is recovery monitored (e.g., perceived fatigue, biometrics like HRV)?
	•	Factors to Analyze:
	•	Placement of rest and recovery days relative to high-intensity sessions.
	•	Integration of active recovery and mobility work that addresses the specific demands of structured running and strength training.
	•	Signs of cumulative fatigue or burnout in the weekly structure.

3. Training Specificity

	•	Questions:
	•	Do the running sessions align with specific goals (e.g., improving speed, endurance, or lactate threshold)?
	•	Are strength sessions targeting the right muscle groups to support running performance (e.g., posterior chain for runners)?
	•	Do running workouts have structured components such as intervals, tempo work, hill repeats, or progression runs?
	•	Factors to Analyze:
	•	Specificity of running sessions to the athlete’s goal (e.g., tempo runs for lactate threshold or long runs with progression for endurance).
	•	Balance between compound and isolation exercises in strength sessions to complement running.
	•	Inclusion of drills or strides to improve running mechanics.

4. Intensity and Volume

	•	Questions:
	•	Are the intensity levels (e.g., 70-75% max effort) for running sessions clearly defined and appropriate for the goal of the workout?
	•	Are the running workouts structured with clear objectives (e.g., intervals, pace changes, or progressive efforts)?
	•	Is the training volume sustainable and productive without risking injury?
	•	Are supersets and burnout techniques in strength training used effectively without overloading?
	•	Factors to Analyze:
	•	Weekly volume of aerobic and strength training, including total mileage and intensity of running workouts.
	•	Clear delineation between low-intensity, moderate-intensity, and high-intensity running sessions.
	•	Alignment of structured running workouts with training zones and performance goals.

5. Integration of Recovery and Mobility

	•	Questions:
	•	Are recovery sessions addressing the specific demands of the week (e.g., tight calves and hamstrings after structured running)?
	•	Are mobility and stretching protocols adequate to support running efficiency and injury prevention?
	•	Are there enough mental recovery strategies in place, given the mental demands of structured running workouts?
	•	Factors to Analyze:
	•	Specificity and duration of recovery activities (e.g., foam rolling, yoga).
	•	Recovery techniques that target running-specific fatigue (e.g., dynamic stretching for hip flexors or glutes).
	•	Timing and focus of mobility work relative to performance and recovery.

6. Athlete Readiness and Individualization

	•	Questions:
	•	Does the program account for the athlete’s fitness level, experience, and running goals (e.g., 5K, marathon)?
	•	Are there built-in adjustments for unforeseen fatigue or life circumstances?
	•	Are structured runs varied enough to keep the athlete engaged and motivated?
	•	Factors to Analyze:
	•	Level of personalization in prescribed running paces, durations, and intervals.
	•	Readiness to adjust sessions based on fatigue or performance feedback.
	•	Use of structured runs (e.g., intervals, negative splits, tempo) to match individual capabilities and goals.

7. Synergy Between Aerobic and Strength Training

	•	Questions:
	•	Are strength and running sessions complementary rather than conflicting (e.g., leg day not clashing with high-intensity intervals)?
	•	Is the schedule designed to maximize performance in both modalities?
	•	Are the running sessions timed to avoid interference effects with strength training?
	•	Factors to Analyze:
	•	Strategic placement of strength and running sessions (e.g., long runs followed by mobility, not heavy squats).
	•	Avoidance of redundant fatigue (e.g., too many high-intensity efforts back-to-back).
	•	Clear synergy in goals, such as endurance benefiting from strength in supporting muscles.

8. Feedback and Adjustments

	•	Questions:
	•	How is feedback from the athlete collected and used to adjust the program?
	•	Are there mechanisms to assess the athlete’s response to structured running (e.g., soreness, motivation)?
	•	Factors to Analyze:
	•	Use of objective measures like heart rate or subjective ones like RPE.
	•	Flexibility in the program to incorporate feedback and prevent stagnation.
	•	Structured plans that allow tweaking running paces or intervals based on performance trends.

Emphasized: Structured Running Workouts

Structured runs are critical to ensure the program targets specific adaptations and avoids generalized aerobic training. Examples include:
	•	Long Runs: Include progressive efforts (e.g., last 15-20 minutes at a faster pace).
	•	Interval Runs: Clearly defined work/rest intervals targeting speed and endurance.
	•	Tempo Runs: Include warm-ups, sustained efforts, and cool-downs.
	•	Hill Work: Incorporate intervals or sustained efforts on hills for strength and power.

By analyzing these aspects, you can ensure the program is both highly effective and engaging, with running sessions that build specific performance metrics rather than just “logging miles.”`
    }),
  ]);

  const llm = prompt.pipe(model.withStructuredOutput(TrainingWeekReflectionSchema));

  const res = await llm.invoke({});

  return {
    trainingWeekReflection: res,
    currentDay: 'Monday'
  };
};

const generateFinalDay = async (
  state: typeof StateAnnotation.State,
  _config: RunnableConfig,
): Promise<typeof StateAnnotation.Update> => {
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    maxTokens: 16384,
    temperature: 0.0
  });

  const dayTemplate = state.trainingBlockTemplate.trainingBlock.schedule.filter((x) => x.day == state.currentDay);

  const day = state.days.filter((x) => x.dayTraining.day == state.currentDay)?.[0];
  const review = state.trainingWeekReflection.trainingWeekReview.filter((x) => x.day == x.day)?.[0]

  const systemContent = `You are an expert hybrid athlete training coach and programming assistant. Your task is to revise and improve the day of training based off the feedback. The goal is to create an excellent day of training.

  [Training Block Template]
  ${JSON.stringify(state.trainingBlockTemplate.trainingBlock, null, 2)}

  [Day Template]
  ${JSON.stringify(dayTemplate, null, 2)}

  [User Onboarding Information]
  ${state.clientAssessment}
  `;


  const prompt = await ChatPromptTemplate.fromMessages([
    new SystemMessage({ content: systemContent }),
    new HumanMessage({
      content: `[Day Of The Week]
      {day}

      [Original Training]
      ${JSON.stringify(day, null, 2)}

      ## Implement the following changes where appropriate.
      ${review.reflection}
    `}),
  ]);

  const llm = prompt.pipe(model.withStructuredOutput(DayTrainingSchema));

  const res = await llm.invoke({ day: state.currentDay });

  return {
    finalWeekOfTraining: res,
    currentDay: getNextWeekday(state.currentDay)
  };
};


/**
 * Routing function: Determines whether to continue research or end the builder.
 * This function decides if the gathered information is satisfactory or if more research is needed.
 *
 * @param state - The current state of the research builder
 * @returns Either "callModel" to continue research or END to finish the builder
 */
export const routeGenerateDay = (
  state: typeof StateAnnotation.State,
): "generateWeekOfTrainingReflection" | "generateDay" => {
  if (!state.currentDay) {
    return "generateWeekOfTrainingReflection";
  }
  // Loop back
  return "generateDay";
};

export const routeGenerateTemplate = (
  state: typeof StateAnnotation.State,
): "generateDay" | "generateTemplateReflection" => {
  if (!state.templateReflection) {
    return "generateTemplateReflection";
  }
  // Loop back
  return "generateDay";
};

export const routeGenerateFinalDay = (
  state: typeof StateAnnotation.State,
): "__end__" | "generateFinalDay" => {
  if (!state.currentDay) {
    return "__end__";
  }
  // Loop back
  return "generateFinalDay";
};

// Finally, create the graph itself.
const builder = new StateGraph(StateAnnotation)
  // Add the nodes to do the work.
  // Chaining the nodes together in this way
  // updates the types of the StateGraph instance
  // so you have static type checking when it comes time
  // to add the edges.
  .addNode("generateTemplate", generateTemplate)
  .addNode("generateTemplateReflection", generateTemplateReflection)
  .addNode("generateDay", generateDay)
  .addNode("generateWeekOfTrainingReflection", generateWeekOfTrainingReflection)
  .addNode("generateFinalDay", generateFinalDay)
  // Regular edges mean "always transition to node B after node A is done"
  // The "__start__" and "__end__" nodes are "virtual" nodes that are always present
  // and represent the beginning and end of the builder.
  .addEdge("__start__", "generateTemplate")
  .addConditionalEdges("generateTemplate", routeGenerateTemplate)
  .addEdge("generateTemplateReflection", "generateTemplate")
  .addEdge("generateWeekOfTrainingReflection", "generateFinalDay")
  .addConditionalEdges("generateDay", routeGenerateDay)
  .addConditionalEdges("generateFinalDay", routeGenerateFinalDay)

export const graph = builder.compile();

graph.name = "New Agent";
