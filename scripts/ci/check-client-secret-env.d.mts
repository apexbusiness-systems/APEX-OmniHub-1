export interface ClientSecretEnvRef {
  /** Repo-relative path of the offending file. */
  file: string;
  /** 1-based line number. */
  line: number;
  /** The matched VITE_* variable name. */
  name: string;
}

export declare const SECRET_ENV_PATTERN: RegExp;
export declare function defaultTargets(repoRoot: string): string[];
export declare function findClientSecretEnvRefs(targets: string[], repoRoot: string): ClientSecretEnvRef[];
