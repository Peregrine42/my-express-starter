import dotenv from "dotenv";
dotenv.config();

import { envVarNames } from "../src/env";
import { validateEnv } from "../src/lib/env";

validateEnv(envVarNames);
