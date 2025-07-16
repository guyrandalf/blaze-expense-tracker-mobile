export const formatMonth = (month: number): string => {
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    new Date(2000, month - 1)
  )
}

export const formatYear = (year: number): string => {
  return year.toString()
}

export const getCurrentYear = (): number => {
  return new Date().getFullYear()
}

export const getYearRange = (
  startYear: number = getCurrentYear() - 1
): number[] => {
  const currentYear = getCurrentYear()
  const years: number[] = []
  for (let year = startYear; year <= currentYear + 5; year++) {
    years.push(year)
  }
  return years
}

export const getMonthsList = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: formatMonth(i + 1),
  }))
}

export const getYearsList = () => {
  return getYearRange().map((year) => ({
    value: year,
    label: formatYear(year),
  }))
}

export default {
  formatMonth,
  formatYear,
  getCurrentYear,
  getYearRange,
  getMonthsList,
  getYearsList,
};
