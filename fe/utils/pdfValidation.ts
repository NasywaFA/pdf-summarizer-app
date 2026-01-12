// Configuration
export const PDF_CONFIG = {
  MAX_FILE_SIZE: Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 3 * 1024 * 1024,
  MIN_FILE_SIZE: Number(process.env.NEXT_PUBLIC_MIN_FILE_SIZE) || 1024,
  ALLOWED_MIME_TYPES: ['application/pdf'],
  ALLOWED_EXTENSIONS: ['.pdf'],
  PDF_MAGIC_NUMBER: [0x25, 0x50, 0x44, 0x46], 
};

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Validate file extension
export const validateFileExtension = (filename: string): ValidationResult => {
  const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  
  if (!PDF_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: 'Invalid file extension. Only PDF files are allowed.',
    };
  }

  return { isValid: true };
};

// Validate file size
export const validateFileSize = (size: number): ValidationResult => {
  if (size < PDF_CONFIG.MIN_FILE_SIZE) {
    return {
      isValid: false,
      error: `File is too small. Minimum size is ${PDF_CONFIG.MIN_FILE_SIZE / 1024} KB.`,
    };
  }

  if (size > PDF_CONFIG.MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File is too large. Maximum size is ${PDF_CONFIG.MAX_FILE_SIZE / 1024 / 1024} MB.`,
    };
  }

  return { isValid: true };
};

// Validate MIME type
export const validateMimeType = (type: string): ValidationResult => {
  if (!PDF_CONFIG.ALLOWED_MIME_TYPES.includes(type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only PDF files are allowed.',
    };
  }

  return { isValid: true };
};

// Validate PDF magic number (file signature)
export const validatePDFMagicNumber = async (file: File): Promise<ValidationResult> => {
  try {
    // Read first 4 bytes
    const arrayBuffer = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Check if file starts with %PDF
    const isValidPDF = bytes.every((byte, index) => byte === PDF_CONFIG.PDF_MAGIC_NUMBER[index]);

    if (!isValidPDF) {
      return {
        isValid: false,
        error: 'File is not a valid PDF. The file content does not match PDF format.',
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to read file content.',
    };
  }
};

// Comprehensive PDF validation
export const validatePDFFile = async (file: File): Promise<ValidationResult> => {
  // 1. Check file extension
  const extensionResult = validateFileExtension(file.name);
  if (!extensionResult.isValid) {
    return extensionResult;
  }

  // 2. Check file size
  const sizeResult = validateFileSize(file.size);
  if (!sizeResult.isValid) {
    return sizeResult;
  }

  // 3. Check MIME type
  const mimeResult = validateMimeType(file.type);
  if (!mimeResult.isValid) {
    return mimeResult;
  }

  // 4. Check PDF magic number (actual file content)
  const magicNumberResult = await validatePDFMagicNumber(file);
  if (!magicNumberResult.isValid) {
    return magicNumberResult;
  }

  return { isValid: true };
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
};

// Get max file size for display
export const getMaxFileSizeFormatted = (): string => {
  return formatFileSize(PDF_CONFIG.MAX_FILE_SIZE);
};