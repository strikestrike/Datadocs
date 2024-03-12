/**
 * Get file extension from object file
 * @param file
 */
export function getFileExtension(file: File): string {
  if (file.type === "text/csv") {
    return "csv";
  } else if (file.type === "application/json") {
    return "json";
  }
  return "csv";
}
