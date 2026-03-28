export const isDataStale = (
  lastUpdate: Date | string,
  days: number = 1,
): boolean => {
  if (!lastUpdate) return true;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const limit = days * MS_PER_DAY;

  const now = new Date().getTime();
  const last = new Date(lastUpdate).getTime();

  return now - last > limit;
};
