import { mockScenarios, mockWeatherTimeline, type MockScenario } from "@/server/providers/mock/mock-data";

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getClockTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function getActiveScenarios(at: Date) {
  const clockTime = timeToMinutes(getClockTime(at));
  return mockScenarios.filter((scenario) => {
    return clockTime >= timeToMinutes(scenario.startsAt) && clockTime <= timeToMinutes(scenario.endsAt);
  });
}

export function getScenarioForAttraction(scenarios: MockScenario[], slug: string) {
  return scenarios.filter((scenario) => scenario.attractionSlugs.includes(slug));
}

export function getWeatherPoint(at: Date) {
  const hour = at.getHours();
  const matchingPoint = [...mockWeatherTimeline]
    .reverse()
    .find((point) => hour >= point.hour);

  return matchingPoint ?? mockWeatherTimeline[0];
}

