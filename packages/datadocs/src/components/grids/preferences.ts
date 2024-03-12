export const QUERY_PREF_STORAGE_KEY = "test_query_preferences";

export type QueryPreferences = {
  previousQuery: string;
  rememberQuery: boolean;
  runOnStart: boolean;
  persistence: boolean;
};

export const defaultQueryPreferences: Required<QueryPreferences> = {
  previousQuery: "",
  rememberQuery: false,
  runOnStart: false,
  persistence: false,
};

export function loadQueryPreferences() {
  console.log("loadPreferences", Date.now());
  const saved = localStorage.getItem(QUERY_PREF_STORAGE_KEY);

  const prefs = { ...defaultQueryPreferences };
  if (!saved) return prefs;
  try {
    const prev = JSON.parse(saved) as Partial<QueryPreferences>;

    if (typeof prev.previousQuery === "string") {
      prefs.previousQuery = prev.previousQuery;
    }
    if (typeof prev.runOnStart === "boolean") {
      prefs.runOnStart = prev.runOnStart;
    }
    if (typeof prev.rememberQuery === "boolean") {
      prefs.rememberQuery = prev.rememberQuery;
    }
    if (typeof prev.persistence === "boolean") {
      prefs.persistence = prev.persistence;
    }
  } catch {
    // Do nothing
  }

  return prefs;
}

export function saveQueryPreferences(prefs: QueryPreferences) {
  localStorage.setItem(QUERY_PREF_STORAGE_KEY, JSON.stringify(prefs));
}
