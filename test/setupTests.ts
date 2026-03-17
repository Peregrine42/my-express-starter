import "@testing-library/jest-dom";
import { envVarNames } from "../src/env";
import { validateEnv } from "../src/lib/env";

validateEnv(envVarNames);

export {};
