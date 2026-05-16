/**
 * Status color utilities that work across light and dark modes
 * Using design system tokens for consistency
 */

export const statusColorMap = {
  completed: {
    bg: "bg-emerald-50/80 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    progressBar: "[&>div]:bg-emerald-500 dark:[&>div]:bg-emerald-400",
  },
  processing: {
    bg: "bg-blue-50/80 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    progressBar: "[&>div]:bg-blue-500 dark:[&>div]:bg-blue-400",
  },
  pending: {
    bg: "bg-amber-50/80 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    progressBar: "[&>div]:bg-amber-500 dark:[&>div]:bg-amber-400",
  },
  warning: {
    bg: "bg-orange-50/80 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-300",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    icon: "text-orange-600 dark:text-orange-400",
    progressBar: "[&>div]:bg-orange-500 dark:[&>div]:bg-orange-400",
  },
  error: {
    bg: "bg-red-50/80 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    progressBar: "[&>div]:bg-red-500 dark:[&>div]:bg-red-400",
  },
  neutral: {
    bg: "bg-gray-50/80 dark:bg-gray-950/40",
    text: "text-gray-700 dark:text-gray-300",
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
  },
}
