export type PointConfig = {
  rank1: number;
  rank2: number;
  rank3: number;
  gradeA: number;
  gradeB: number;
  gradeC: number;
};

export const DEFAULT_POINTS_CONFIG: PointConfig = {
  rank1: 5,
  rank2: 3,
  rank3: 1,
  gradeA: 5,
  gradeB: 3,
  gradeC: 0
};

export function getProgramPointConfig(
  program: {
    type?: string;
    category?: {
      pointMatrix?: {
        individualPoints?: string | null;
        groupPoints?: string | null;
        generalPoints?: string | null;
      } | null;
    } | null;
    event?: {
      generalPointMatrix?: {
        generalPoints?: string | null;
      } | null;
    } | null;
  } | null | undefined,
  fallbackGeneralPointMatrix?: { generalPoints?: string | null } | null
): PointConfig {
  if (!program) return DEFAULT_POINTS_CONFIG;

  if (program.type === "GENERAL") {
    const generalPointsStr =
      program.event?.generalPointMatrix?.generalPoints ||
      fallbackGeneralPointMatrix?.generalPoints ||
      program.category?.pointMatrix?.generalPoints;
    if (generalPointsStr) {
      try {
        const parsed = JSON.parse(generalPointsStr);
        return {
          rank1: Number(parsed.rank1 ?? 5),
          rank2: Number(parsed.rank2 ?? 3),
          rank3: Number(parsed.rank3 ?? 1),
          gradeA: Number(parsed.gradeA ?? 5),
          gradeB: Number(parsed.gradeB ?? 3),
          gradeC: Number(parsed.gradeC ?? 0)
        };
      } catch (e) {}
    }
  } else if (program.category?.pointMatrix) {
    const pointsStr =
      program.type === "INDIVIDUAL"
        ? program.category.pointMatrix.individualPoints
        : program.category.pointMatrix.groupPoints;
    if (pointsStr) {
      try {
        const parsed = JSON.parse(pointsStr);
        return {
          rank1: Number(parsed.rank1 ?? (program.type === "INDIVIDUAL" ? 5 : 10)),
          rank2: Number(parsed.rank2 ?? (program.type === "INDIVIDUAL" ? 3 : 7)),
          rank3: Number(parsed.rank3 ?? (program.type === "INDIVIDUAL" ? 1 : 5)),
          gradeA: Number(parsed.gradeA ?? 5),
          gradeB: Number(parsed.gradeB ?? 3),
          gradeC: Number(parsed.gradeC ?? 0)
        };
      } catch (e) {}
    }
  }

  return DEFAULT_POINTS_CONFIG;
}

export function calculatePoints(
  rank: number | string | null | undefined,
  grade: string | null | undefined,
  config: PointConfig
): number {
  let pts = 0;
  const r = rank !== undefined && rank !== null ? String(rank).trim() : "";
  const g = grade ? String(grade).trim().toUpperCase() : "";

  if (r === "1") pts += config.rank1;
  else if (r === "2") pts += config.rank2;
  else if (r === "3") pts += config.rank3;

  if (g === "A") pts += config.gradeA;
  else if (g === "B") pts += config.gradeB;
  else if (g === "C") pts += config.gradeC;

  return pts;
}
