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
  // defaults to "_Z"
  cppPattern?: string;  
  // defaults to "_ZN"
  rustPattern?: string; 
}
