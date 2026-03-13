export type HelpFaqItem = {
  id: string;
  question: string;
  answer: string;
  tags: string[];
};

export const HELP_FAQ_ITEMS: HelpFaqItem[] = [
  {
    id: "what-is-parqara",
    question: "What is Parqara?",
    answer:
      "Parqara is an adventure planner. It keeps the plan, the route, live updates, and shared changes in one place so your group is not juggling notes, screenshots, and chat threads.",
    tags: ["overview", "planning", "product"],
  },
  {
    id: "what-is-mara",
    question: "What can Mara help with?",
    answer:
      "Mara is the planning agent inside Parqara. Use her to shape a trip, fill in missing details, change pacing, review tradeoffs, and adjust the plan when priorities change.",
    tags: ["mara", "assistant", "planning"],
  },
  {
    id: "how-to-start",
    question: "What should I tell Mara first?",
    answer:
      "Start with just one or two details: where you want to go, when it is happening, who is going, or what matters most. Mara should ask for the next one or two details from there instead of making you fill everything out at once.",
    tags: ["mara", "getting started", "trip setup"],
  },
  {
    id: "share-planner",
    question: "How do shared planners work?",
    answer:
      "You can add existing Parqara users directly or invite someone by email. If the invited person does not have an account yet, they will get an email telling them to create one before they can open the planner.",
    tags: ["sharing", "collaboration", "invite"],
  },
  {
    id: "your-people",
    question: "What is the saved contacts list on the profile page?",
    answer:
      "It is your saved list of contacts who already have Parqara accounts. It speeds up sharing because you can add them to a planner without typing their email every time.",
    tags: ["profile", "sharing", "people"],
  },
  {
    id: "notifications",
    question: "What kinds of notifications show up in the inbox?",
    answer:
      "The inbox collects app communication in one place, including planner changes, collaborator updates, live ride or weather alerts, and other trip-related notices.",
    tags: ["notifications", "inbox", "alerts"],
  },
  {
    id: "plans",
    question: "How do the plans differ?",
    answer:
      "Free gives you the planner workspace and a short Mara preview. Plus adds live tools and replans. Pro unlocks full Mara and sharing tools for collaboration.",
    tags: ["billing", "plans", "pricing"],
  },
  {
    id: "feedback",
    question: "How should I send product feedback?",
    answer:
      "Use the feedback form on this page. Include what you were trying to do, what felt confusing or broken, and screenshots if they help explain the issue.",
    tags: ["feedback", "support", "bugs"],
  },
];

