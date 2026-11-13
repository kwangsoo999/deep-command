export interface Career {
  attempts: number;
  best: { mission: number; score: number; grade: string; time: number }[];
  research: string[];
}
export const emptyCareer = (): Career => ({
  attempts: 0,
  best: [],
  research: [],
});
export const ranks = [
  ["Cadet", 0],
  ["Junior Officer", 400],
  ["Officer", 900],
  ["Senior Officer", 1600],
  ["Commander", 2300],
  ["Captain", 3000],
  ["Fleet Commander", 3600],
] as const;
export function commandRank(xp: number) {
  let index = 0;
  for (let i = 0; i < ranks.length; i++) if (xp >= ranks[i][1]) index = i;
  return {
    name: ranks[index][0],
    next: ranks[index + 1]?.[0] ?? null,
    remaining: Math.max(0, (ranks[index + 1]?.[1] ?? xp) - xp),
    progress:
      index === ranks.length - 1
        ? 100
        : Math.min(
            100,
            ((xp - ranks[index][1]) / (ranks[index + 1][1] - ranks[index][1])) *
              100,
          ),
  };
}
export const technologies = [
  {
    id: "routing",
    name: "Lập tuyến nâng cao",
    cost: 25,
    description: "Tăng 10% tốc độ hành trình game.",
  },
  {
    id: "analysis",
    name: "Đối chiếu tín hiệu",
    cost: 25,
    description: "Thêm 5 độ tin cậy mỗi lượt quét sonar.",
  },
  {
    id: "recycling",
    name: "Thu hồi vật tư",
    cost: 50,
    description: "Hoàn lại 2 vật tư sau xử lý tiêu chuẩn.",
  },
] as const;
export const missionUnlocked = (completed: number[], index: number) =>
  Number.isInteger(index) &&
  index >= 0 &&
  index < 5 &&
  (index === 0 || completed.includes(index - 1));
