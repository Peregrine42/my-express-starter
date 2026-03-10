export const validateEnv = (envVarNames: readonly string[]) => {
  const missing = envVarNames.filter((envVarName) => {
    const val = process.env[envVarName];
    return typeof val !== "string" || val.length === 0;
  });

  if (missing.length > 0) {
    throw new Error(`
Missing these env vars: 
${missing.join("\n")}
`);
  }
};
