export interface ValidationResult {
  success: boolean;
  error_message?: string;
  verifier_output: string;
  num_errors: number;
}

export interface ValidationOptions {
  cppFile: File;
  rustFile: File;
  functionName?: string;
  cppPattern?: string;  // Defaults to "_Z"
  rustPattern?: string; // Defaults to "_ZN"
}
