import { TourStep } from "@/components/OnboardingTour";

type TourConfig = Record<string, TourStep[]>;

export const tourSteps: TourConfig = {
  login: [
    {
      id: "login-branding",
      target: "login-branding",
      title: "Welcome to ArtsFest",
      description:
        "Your festival name and motto are displayed here. This is personalized for your organization.",
      position: "bottom",
    },
    {
      id: "login-username",
      target: "login-username",
      title: "Your Username",
      description:
        "Enter the username provided by your festival administrator. Each user has a unique login.",
      position: "bottom",
    },
    {
      id: "login-password",
      target: "login-password",
      title: "Your Password",
      description:
        "Enter your password securely. Credentials are encrypted and managed by your admin.",
      position: "bottom",
    },
    {
      id: "login-submit",
      target: "login-submit",
      title: "Sign In",
      description:
        "Click to access your dashboard. You will be redirected based on your assigned role (Admin, Manager, Media, or Judge).",
      position: "top",
    },
  ],

  dashboard: [
    {
      id: "dash-stats",
      target: "dash-stats",
      title: "Live Statistics",
      description:
        "These cards show real-time festival statistics at a glance, including events, teams, programs, participants, and results.",
      position: "bottom",
    },
    {
      id: "dash-welcome",
      target: "dash-welcome",
      title: "Welcome Panel",
      description:
        "Your personalized welcome message with quick action shortcuts tailored to your role.",
      position: "right",
    },
    {
      id: "dash-hub-btn",
      target: "dash-hub-btn",
      title: "Live Management Hub",
      description:
        "Open the Live Hub to display real-time standings on a projector or public screen.",
      position: "bottom",
    },
    {
      id: "dash-guidelines",
      target: "dash-guidelines",
      title: "Feature Guides",
      description:
        "Detailed step-by-step guides for every feature. Browse tabs to learn about scratch cards, ID cards, team sorting, and poster customization.",
      position: "top",
    },
  ],

  events: [
    {
      id: "events-form",
      target: "events-form",
      title: "Create a New Event",
      description:
        "Events are the foundation of your festival. Each event is an isolated tenant with its own teams, programs, categories, and results.",
      position: "right",
    },
    {
      id: "events-list",
      target: "events-list",
      title: "All Events",
      description:
        "View all your events here. Click 'Configure' to manage categories, point schemes, and divisions for each event.",
      position: "left",
    },
  ],

  eventDetail: [
    {
      id: "event-categories",
      target: "event-categories",
      title: "Category Manager",
      description:
        "Add age-group categories like Sub-Junior, Junior, and Senior. Each category can have its own point scheme.",
      position: "bottom",
    },
    {
      id: "event-general-points",
      target: "event-general-points",
      title: "General Point Scheme",
      description:
        "Set the default point scheme used for general championship calculations across all categories.",
      position: "top",
    },
    {
      id: "event-point-matrix",
      target: "event-point-matrix",
      title: "Category Point Matrix",
      description:
        "Configure category-specific point schemes for individual and group programs. This controls how ranks are converted to points.",
      position: "top",
    },
  ],

  teams: [
    {
      id: "teams-form",
      target: "teams-form",
      title: "Create a New Team",
      description:
        "Add participating teams with unique prefix codes (used for chest number generation) and flag colors for visual identification.",
      position: "right",
    },
    {
      id: "teams-list",
      target: "teams-list",
      title: "All Teams",
      description:
        "View all teams, their assigned managers, candidate counts, and flag colors. You can edit teams or assign managers here.",
      position: "left",
    },
  ],

  candidates: [
    {
      id: "candidates-form",
      target: "candidates-form",
      title: "Register a Candidate",
      description:
        "Add a new candidate with their name, photo URL, and age-group category. Chest numbers are auto-generated or assigned manually.",
      position: "bottom",
    },
    {
      id: "candidates-filters",
      target: "candidates-filters",
      title: "Filter & Search",
      description:
        "Filter candidates by team or category to quickly find specific participants.",
      position: "bottom",
    },
    {
      id: "candidates-list",
      target: "candidates-list",
      title: "Candidate List",
      description:
        "View all registered candidates. Admins can approve or edit candidates. Managers can edit their own team's candidates.",
      position: "top",
    },
    {
      id: "candidates-idcards",
      target: "candidates-idcards",
      title: "Bulk ID Cards",
      description:
        "Print professional participant ID cards in bulk. Cards include chest numbers, photos, team details, and assigned programs.",
      position: "left",
    },
  ],

  programs: [
    {
      id: "programs-form",
      target: "programs-form",
      title: "Create a Program",
      description:
        "Define competition programs (e.g., Solo Song, Group Dance) with type (Individual/Group), category, time limits, and candidate limits per team.",
      position: "right",
    },
    {
      id: "programs-bulk",
      target: "programs-bulk",
      title: "Bulk Actions",
      description:
        "Import programs via spreadsheet or perform bulk category assignments to save time.",
      position: "bottom",
    },
    {
      id: "programs-list",
      target: "programs-list",
      title: "All Programs",
      description:
        "View and manage all programs. Click to edit details, set schedules, or configure candidate limits.",
      position: "left",
    },
  ],

  scoring: [
    {
      id: "scoring-switcher",
      target: "scoring-switcher",
      title: "Event Switcher",
      description:
        "Switch between events if you are managing multiple festivals simultaneously.",
      position: "bottom",
    },
    {
      id: "scoring-form",
      target: "scoring-form",
      title: "Rapid Result Entry",
      description:
        "Enter marks for candidates in each program. Select a program, then enter marks for each candidate. Points and ranks are auto-calculated.",
      position: "right",
    },
    {
      id: "scoring-teams",
      target: "scoring-teams",
      title: "Live Team Standings",
      description:
        "Real-time team points leaderboard. Published results contribute to team scores instantly.",
      position: "left",
    },
    {
      id: "scoring-results",
      target: "scoring-results",
      title: "Results Management",
      description:
        "View, edit, publish, or unpublish results. Published results appear on public standings and the Live Hub.",
      position: "top",
    },
    {
      id: "scoring-pending",
      target: "scoring-pending",
      title: "Pending Programs",
      description:
        "Programs that have assignments but no results yet. Use this list to track which programs still need scoring.",
      position: "left",
    },
  ],

  schedule: [
    {
      id: "schedule-switcher",
      target: "schedule-switcher",
      title: "Event Switcher",
      description:
        "Switch between events to manage different festival schedules.",
      position: "bottom",
    },
    {
      id: "schedule-grid",
      target: "schedule-grid",
      title: "Schedule Timeline",
      description:
        "Set start times, durations, and venues for each program. Drag to reorder programs in the timeline.",
      position: "bottom",
    },
    {
      id: "schedule-print",
      target: "schedule-print",
      title: "Print Options",
      description:
        "Print the complete schedule or venue-wise lists for distribution to participants and staff.",
      position: "left",
    },
  ],

  media: [
    {
      id: "media-poster",
      target: "media-poster",
      title: "Poster Settings",
      description:
        "Upload branding assets (headers, footers, logos, backgrounds) and set brand colors for result announcement posters.",
      position: "bottom",
    },
    {
      id: "media-category",
      target: "media-category",
      title: "Category Branding",
      description:
        "Set custom background images for each category's result posters (e.g., different themes for Junior vs Senior).",
      position: "top",
    },
    {
      id: "media-downloads",
      target: "media-downloads",
      title: "Template Download Center",
      description:
        "Access published program result boards. Download clean templates for manual design work.",
      position: "left",
    },
  ],

  settings: [
    {
      id: "settings-config",
      target: "settings-config",
      title: "General Configuration",
      description:
        "Set your festival name, motto, logo, and registration deadlines. These settings apply across your event.",
      position: "bottom",
    },
    {
      id: "settings-audit",
      target: "settings-audit",
      title: "Assignment Audit",
      description:
        "Review all program assignments across teams. Identify pending approvals or conflicts before the competition.",
      position: "top",
    },
    {
      id: "settings-maintenance",
      target: "settings-maintenance",
      title: "Data Management",
      description:
        "Power tools for admins: reset results, regenerate chest numbers, and perform bulk data operations.",
      position: "top",
    },
  ],

  assignments: [
    {
      id: "assignments-form",
      target: "assignments-form",
      title: "Program Assignments",
      description:
        "Assign your approved candidates to programs. Category limits and eligibility rules are enforced automatically. Select a candidate to see available programs.",
      position: "bottom",
    },
  ],

  hub: [
    {
      id: "hub-standings",
      target: "hub-standings",
      title: "Live Team Standings",
      description:
        "Real-time team points leaderboard. Rankings update automatically as results are published by judges.",
      position: "bottom",
    },
    {
      id: "hub-results",
      target: "hub-results",
      title: "Program Results",
      description:
        "Click any program to view detailed rankings, grades, and scores. Perfect for projector displays during ceremonies.",
      position: "top",
    },
  ],

  landing: [
    {
      id: "landing-events",
      target: "landing-events",
      title: "Running Events",
      description:
        "View all active festival events. Click on any event to see its live public standings and results.",
      position: "bottom",
    },
    {
      id: "landing-tools",
      target: "landing-tools",
      title: "Management Tools",
      description:
        "Explore the full suite of festival management features including scoring, scheduling, ID cards, and poster customization.",
      position: "top",
    },
  ],
};

export function getTourSteps(pageId: string): TourStep[] {
  return tourSteps[pageId] || [];
}
