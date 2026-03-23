export const APP_CONFIG = Object.freeze({
  API_SQL_BASE_URL: "https://comp-4537-term-project.onrender.com/api/ai/evaluate",
  SQL_WRAP_PREFIX: '"',
  SQL_WRAP_SUFFIX: '"'
});

export const UI_STRINGS = Object.freeze({
  PAGE_TITLE: "Ai test",
  HEADING: "Ai test",
  SUBHEADING: "",
  QUERY_TITLE: "Data",
  QUERY_LABEL: "Query",
  QUERY_PLACEHOLDER: "",
  QUERY_BUTTON: "Submit",
  QUERY_HELP: "",
  STATUS_READY: "Ready.",
  STATUS_QUERYING: "Running query...",
  STATUS_QUERY_OK: "Query completed successfully.",
  QUERY_DEFAULT_SQL: 
  `{    question: What is 2 + 5,
        referenceAnswer : 7,
        studentAnswer: 8
  }`,
  STATUS_EMPTY_QUERY: "Please enter a query.",
  STATUS_ERROR_PREFIX: "Request failed:",
});

